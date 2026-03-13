import fs from "node:fs";
import type {
  Bucket,
  CoverageClassification,
  MethodologyResponse,
  ModelUsageEntry,
  OverviewDiagnostics,
  OverviewResponse,
  TimeseriesPoint,
  TimeseriesResponse,
  WaterRange
} from "@agentic-insights/shared";
import { getOrCreateCalibration, buildSignature } from "./calibration.js";
import { parseClaudeProjectFile, parseClaudeSessionMetaFile } from "./claude.js";
import { getTuiLogPath, listClaudeProjectFiles, listClaudeSessionMetaFiles, listSessionFiles } from "./discovery.js";
import { getCodexHomeConfig, getDefaultClaudeHome } from "./paths.js";
import { parseSessionFile, parseSessionPrompts, parseTuiFallback } from "./parser.js";
import { aggregateDayTimeseries, aggregateFromDayBuckets } from "./aggregation.js";
import {
  BENCHMARK_COEFFICIENTS,
  PRICING_CATALOG_METADATA,
  PRICING_TABLE,
  calculateEventCostUsd,
  canonicalizePricingIdentity,
  getMethodologySourcesByTab,
  getPricingEntry
} from "./pricing.js";
import type { ClassifiedUsageEvent, CoverageDetailAggregate, DataSnapshot, PromptRecord, RawUsageEvent } from "./types.js";

function zeroRange(): WaterRange {
  return { low: 0, central: 0, high: 0 };
}

function scaleRange(base: WaterRange, multiplier: number): WaterRange {
  return {
    low: base.low * multiplier,
    central: base.central * multiplier,
    high: base.high * multiplier
  };
}

function sumRange(target: WaterRange, source: WaterRange): void {
  target.low += source.low;
  target.central += source.central;
  target.high += source.high;
}

function dedupeEvents(events: RawUsageEvent[]): RawUsageEvent[] {
  const map = new Map<string, RawUsageEvent>();
  for (const event of events) {
    const existing = map.get(event.id);
    if (!existing || event.ts < existing.ts) {
      map.set(event.id, event);
    }
  }
  return [...map.values()].sort((a, b) => a.ts - b.ts);
}

function dedupePrompts(prompts: PromptRecord[]): PromptRecord[] {
  const map = new Map<string, PromptRecord>();
  for (const prompt of prompts) {
    const existing = map.get(prompt.id);
    if (!existing || prompt.ts < existing.ts) {
      map.set(prompt.id, prompt);
    }
  }

  return [...map.values()].sort((a, b) => a.ts - b.ts);
}

function createDiagnostics(
  state: OverviewDiagnostics["state"],
  codexHome: string,
  message: string | null
): OverviewDiagnostics {
  return {
    state,
    codexHome,
    message
  };
}

function createSnapshot(signature: string, diagnostics: OverviewDiagnostics): DataSnapshot {
  return {
    signature,
    events: [],
    promptRecords: [],
    coverageDetails: [],
    exclusions: [],
    pricingTable: PRICING_TABLE,
    pricingCatalog: PRICING_CATALOG_METADATA,
    sourcesByTab: getMethodologySourcesByTab([]),
    benchmarks: BENCHMARK_COEFFICIENTS,
    calibration: null,
    lastIndexedAt: null,
    diagnostics
  };
}

function getNoDataMessage(foundArtifacts: boolean): string {
  if (foundArtifacts) {
    return "Local coding agent data was found, but no token history could be parsed yet.";
  }

  return "No local coding agent usage files were found in the tracked directories yet.";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The local coding agent usage directories could not be read.";
}

function formatSourceLabel(source: string): string {
  const normalized = source.trim().toLowerCase();
  if (!normalized || normalized === "unknown") {
    return "Unknown";
  }

  if (normalized === "vscode") {
    return "VS Code extension";
  }

  if (normalized === "cli" || normalized === "exec") {
    return "CLI";
  }

  if (normalized === "claude_code") {
    return "Claude Code";
  }

  return normalized
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function addCoverageDetail(
  details: Map<string, CoverageDetailAggregate>,
  event: RawUsageEvent,
  classification: CoverageClassification,
  reason: string | null
): void {
  const canonicalIdentity = canonicalizePricingIdentity(event.provider, event.model);
  const source = formatSourceLabel(event.source);
  const key = [canonicalIdentity.provider, canonicalIdentity.model, source, classification, reason ?? ""].join("|");
  const current = details.get(key) ?? {
    provider: canonicalIdentity.provider,
    model: canonicalIdentity.model,
    source,
    tokens: 0,
    events: 0,
    classification,
    reason
  };

  current.tokens += event.totalTokens;
  current.events += 1;
  details.set(key, current);
}

function getMonitoredDataPath(codexHome: string, claudeHome: string): string {
  return `${codexHome}\n${claudeHome}`;
}

function buildModelUsage(coverageDetails: CoverageDetailAggregate[]): ModelUsageEntry[] {
  const usage = new Map<string, ModelUsageEntry>();

  for (const detail of coverageDetails) {
    const key = `${detail.provider}:${detail.model}`;
    const current = usage.get(key) ?? {
      provider: detail.provider,
      model: detail.model,
      totalTokens: 0,
      events: 0,
      supportedTokens: 0,
      excludedTokens: 0,
      unestimatedTokens: 0
    };

    current.totalTokens += detail.tokens;
    current.events += detail.events;

    if (detail.classification === "supported") {
      current.supportedTokens += detail.tokens;
    } else if (detail.classification === "excluded") {
      current.excludedTokens += detail.tokens;
    } else {
      current.unestimatedTokens += detail.tokens;
    }

    usage.set(key, current);
  }

  return [...usage.values()].sort((left, right) => {
    if (right.totalTokens !== left.totalTokens) {
      return right.totalTokens - left.totalTokens;
    }

    return `${left.provider}:${left.model}`.localeCompare(`${right.provider}:${right.model}`);
  });
}

function classifyEvents(rawEvents: RawUsageEvent[], signature: string): Pick<DataSnapshot, "events" | "coverageDetails" | "exclusions" | "calibration"> {
  const supportedCosts = rawEvents
    .flatMap((event) => {
      if (
        event.inputTokens === null ||
        event.cachedInputTokens === null ||
        event.outputTokens === null ||
        event.transport === "tui_fallback"
      ) {
        return [];
      }

      const pricing = getPricingEntry(event.provider, event.model);
      return pricing
        ? [calculateEventCostUsd(pricing, event.inputTokens, event.cachedInputTokens, event.outputTokens)]
        : [];
    })
    .filter((value) => value > 0);

  const calibration = getOrCreateCalibration(signature, supportedCosts);
  const coverageDetails = new Map<string, CoverageDetailAggregate>();

  const events: ClassifiedUsageEvent[] = rawEvents.map((event) => {
    if (
      event.transport === "tui_fallback" ||
      event.inputTokens === null ||
      event.cachedInputTokens === null ||
      event.outputTokens === null
    ) {
      const reason = "Token totals are available, but token splits needed for pricing-weighted estimation are missing.";
      addCoverageDetail(coverageDetails, event, "token_only", reason);

      return {
        ...event,
        classification: "token_only",
        waterLitres: zeroRange(),
        eventCostUsd: null,
        exclusionReason: reason
      };
    }

    const pricing = getPricingEntry(event.provider, event.model);
    if (!pricing) {
      const canonicalIdentity = canonicalizePricingIdentity(event.provider, event.model);
      const reason =
        event.provider !== "openai" && event.provider !== "anthropic" && event.provider !== "claude"
          ? `Unsupported provider: ${event.provider}`
          : `Unsupported model: ${canonicalIdentity.model}`;
      addCoverageDetail(coverageDetails, event, "excluded", reason);

      return {
        ...event,
        classification: "excluded",
        waterLitres: zeroRange(),
        eventCostUsd: null,
        exclusionReason: reason
      };
    }

    const eventCostUsd = calculateEventCostUsd(pricing, event.inputTokens, event.cachedInputTokens, event.outputTokens);
    const waterLitres =
      calibration && calibration.referenceEventCostUsd > 0
        ? scaleRange(BENCHMARK_COEFFICIENTS, eventCostUsd / calibration.referenceEventCostUsd)
        : zeroRange();
    addCoverageDetail(coverageDetails, event, "supported", null);

    return {
      ...event,
      classification: "supported",
      waterLitres,
      eventCostUsd,
      exclusionReason: null
    };
  });

  const sortedCoverageDetails = [...coverageDetails.values()].sort((a, b) => {
    if (b.tokens !== a.tokens) {
      return b.tokens - a.tokens;
    }

    return [a.provider, a.model, a.source].join("|").localeCompare([b.provider, b.model, b.source].join("|"));
  });

  return {
    events,
    coverageDetails: sortedCoverageDetails,
    exclusions: sortedCoverageDetails.flatMap((item) => {
      if (item.classification !== "excluded" || item.reason === null) {
        return [];
      }

      return [
        {
          provider: item.provider,
          model: item.model,
          source: item.source,
          tokens: item.tokens,
          events: item.events,
          reason: item.reason
        }
      ];
    }),
    calibration
  };
}

export class DashboardService {
  private cachedSnapshot: DataSnapshot | null = null;
  private dayTimeseriesCache = new Map<string, TimeseriesPoint[]>();
  private timeseriesCache = new Map<string, TimeseriesPoint[]>();

  public getOverview(): OverviewResponse {
    const snapshot = this.getSnapshot();
    const waterLitres = zeroRange();
    let totalTokens = 0;
    let supportedTokens = 0;
    let excludedTokens = 0;
    let unestimatedTokens = 0;
    let supportedEvents = 0;
    let excludedEvents = 0;
    let tokenOnlyEvents = 0;

    for (const event of snapshot.events) {
      totalTokens += event.totalTokens;
      sumRange(waterLitres, event.waterLitres);

      if (event.classification === "supported") {
        supportedTokens += event.totalTokens;
        supportedEvents += 1;
      } else if (event.classification === "excluded") {
        excludedTokens += event.totalTokens;
        excludedEvents += 1;
      } else {
        unestimatedTokens += event.totalTokens;
        tokenOnlyEvents += 1;
      }
    }

    return {
      tokenTotals: {
        totalTokens,
        supportedTokens,
        excludedTokens,
        unestimatedTokens
      },
      waterLitres,
      coverage: {
        supportedEvents,
        excludedEvents,
        tokenOnlyEvents
      },
      coverageSummary: {
        sessions: new Set([...snapshot.events.map((event) => event.sessionId), ...snapshot.promptRecords.map((prompt) => prompt.sessionId)]).size,
        prompts: snapshot.promptRecords.length,
        excludedModels: snapshot.coverageDetails.filter((item) => item.classification === "excluded").length
      },
      modelUsage: buildModelUsage(snapshot.coverageDetails),
      coverageDetails: snapshot.coverageDetails,
      exclusions: snapshot.exclusions,
      lastIndexedAt: snapshot.lastIndexedAt,
      calibration: snapshot.calibration,
      diagnostics: snapshot.diagnostics
    };
  }

  public getTimeseries(bucket: Bucket, timeZone: string): TimeseriesResponse {
    const snapshot = this.getSnapshot();
    const cacheKey = this.getTimeseriesCacheKey(snapshot.signature, bucket, timeZone);
    const cached = this.timeseriesCache.get(cacheKey);

    if (cached) {
      return {
        bucket,
        points: cached
      };
    }

    const dayPoints = this.getDayTimeseries(snapshot, timeZone);
    const points = bucket === "day" ? dayPoints : aggregateFromDayBuckets(dayPoints, bucket, timeZone);
    this.timeseriesCache.set(cacheKey, points);

    return {
      bucket,
      points
    };
  }

  public getMethodology(): MethodologyResponse {
    const snapshot = this.getSnapshot();
    return {
      pricingTable: snapshot.pricingTable,
      benchmarkCoefficients: snapshot.benchmarks,
      calibration: snapshot.calibration,
      exclusions: snapshot.exclusions,
      pricingCatalog: snapshot.pricingCatalog,
      sourcesByTab: snapshot.sourcesByTab
    };
  }

  private getSnapshot(): DataSnapshot {
    const codexHomeConfig = getCodexHomeConfig();
    const codexHome = codexHomeConfig.path;
    const claudeHome = getDefaultClaudeHome();
    const dataPath = getMonitoredDataPath(codexHome, claudeHome);

    try {
      const codexExists = fs.existsSync(codexHome);
      const codexIsDirectory = codexExists && fs.statSync(codexHome).isDirectory();
      const claudeExists = fs.existsSync(claudeHome);
      const claudeIsDirectory = claudeExists && fs.statSync(claudeHome).isDirectory();

      const codexFiles = codexIsDirectory ? listSessionFiles(codexHome) : [];
      const tuiLogPath = getTuiLogPath(codexHome);
      const logFingerprint =
        codexIsDirectory && fs.existsSync(tuiLogPath)
          ? [{ path: tuiLogPath, mtimeMs: Math.floor(fs.statSync(tuiLogPath).mtimeMs), size: fs.statSync(tuiLogPath).size }]
          : [];
      const codexEvents = codexIsDirectory
        ? (() => {
            const fallbackMap = parseTuiFallback(tuiLogPath);
            return codexFiles.flatMap((file) => parseSessionFile(file.path, fallbackMap));
          })()
        : [];
      const codexPrompts = codexIsDirectory ? codexFiles.flatMap((file) => parseSessionPrompts(file.path)) : [];

      const claudeProjectFiles = claudeIsDirectory ? listClaudeProjectFiles(claudeHome) : [];
      const claudeSessionMetaFiles = claudeIsDirectory ? listClaudeSessionMetaFiles(claudeHome) : [];
      const claudeSessionModels = new Map<string, string>();
      const parsedClaudeProjects = claudeProjectFiles.map((file) => parseClaudeProjectFile(file.path));
      const claudeProjectEvents = parsedClaudeProjects.flatMap((parsed) => {
        for (const [sessionId, model] of parsed.sessionModels.entries()) {
          if (!claudeSessionModels.has(sessionId)) {
            claudeSessionModels.set(sessionId, model);
          }
        }
        return parsed.events;
      });
      const claudeProjectPrompts = parsedClaudeProjects.flatMap((parsed) => parsed.prompts);
      const claudeMetaEvents = claudeSessionMetaFiles.flatMap((file) =>
        parseClaudeSessionMetaFile(file.path, {
          sessionModels: claudeSessionModels,
          sessionsWithProjectEvents: new Set(claudeProjectEvents.map((event) => event.sessionId))
        })
      );

      const rawEvents = dedupeEvents([...codexEvents, ...claudeProjectEvents, ...claudeMetaEvents]);
      const promptRecords = dedupePrompts([...codexPrompts, ...claudeProjectPrompts]);
      const fingerprint = [
        ...codexFiles.map((file) => ({ path: file.path, mtimeMs: file.mtimeMs, size: file.size })),
        ...logFingerprint,
        ...claudeProjectFiles.map((file) => ({ path: file.path, mtimeMs: file.mtimeMs, size: file.size })),
        ...claudeSessionMetaFiles.map((file) => ({ path: file.path, mtimeMs: file.mtimeMs, size: file.size }))
      ];
      const foundArtifacts = fingerprint.length > 0;
      const codexConfiguredInvalid =
        codexHomeConfig.fromEnv && (!codexExists || (codexExists && !codexIsDirectory));
      const diagnostics =
        rawEvents.length > 0 || promptRecords.length > 0
          ? createDiagnostics("ready", dataPath, null)
          : codexConfiguredInvalid
            ? createDiagnostics(
                "read_error",
                dataPath,
                !codexExists ? "Configured Codex home does not exist." : "Configured Codex home is not a directory."
              )
            : createDiagnostics("no_data", dataPath, getNoDataMessage(foundArtifacts));
      const signature = buildSignature({
        codexHome,
        claudeHome,
        codexHomeState: diagnostics.state === "ready" ? "ready" : "empty",
        fileFingerprint: fingerprint
      });

      if (this.cachedSnapshot?.signature === signature) {
        return this.cachedSnapshot;
      }

      const classified = classifyEvents(rawEvents, signature);
      const lastIndexedAt = fingerprint.length > 0 ? Math.max(...fingerprint.map((file) => file.mtimeMs)) : null;

      return this.cacheSnapshot({
        signature,
        events: classified.events,
        promptRecords,
        coverageDetails: classified.coverageDetails,
        exclusions: classified.exclusions,
        pricingTable: PRICING_TABLE,
        pricingCatalog: PRICING_CATALOG_METADATA,
        sourcesByTab: getMethodologySourcesByTab(rawEvents.map((event) => event.provider)),
        benchmarks: BENCHMARK_COEFFICIENTS,
        calibration: classified.calibration,
        lastIndexedAt,
        diagnostics
      });
    } catch (error) {
      const diagnostics = createDiagnostics("read_error", dataPath, getErrorMessage(error));
      return this.getOrCacheSnapshot(
        createSnapshot(
          buildSignature({
            codexHome,
            claudeHome,
            codexHomeState: "read_error",
            fileFingerprint: []
          }),
          diagnostics
        )
      );
    }
  }

  private getOrCacheSnapshot(snapshot: DataSnapshot): DataSnapshot {
    if (this.cachedSnapshot?.signature === snapshot.signature) {
      return this.cachedSnapshot;
    }

    return this.cacheSnapshot(snapshot);
  }

  private getDayTimeseries(snapshot: DataSnapshot, timeZone: string): TimeseriesPoint[] {
    const cacheKey = `${snapshot.signature}|${timeZone}`;
    const cached = this.dayTimeseriesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const points = aggregateDayTimeseries(snapshot.events, timeZone);
    this.dayTimeseriesCache.set(cacheKey, points);
    this.timeseriesCache.set(this.getTimeseriesCacheKey(snapshot.signature, "day", timeZone), points);
    return points;
  }

  private getTimeseriesCacheKey(signature: string, bucket: Bucket, timeZone: string): string {
    return `${signature}|${bucket}|${timeZone}`;
  }

  private cacheSnapshot(snapshot: DataSnapshot): DataSnapshot {
    if (this.cachedSnapshot?.signature !== snapshot.signature) {
      this.dayTimeseriesCache.clear();
      this.timeseriesCache.clear();
    }

    this.cachedSnapshot = snapshot;
    return snapshot;
  }
}
