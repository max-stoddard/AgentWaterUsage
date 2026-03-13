import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as aggregation from "../src/aggregation.js";
import { DashboardService } from "../src/service.js";
import { createCacheDir, createClaudeHome, createCodexHome, writeJsonFile, writeJsonlFile } from "./helpers.js";

let previousCodexHome: string | undefined;
let previousCacheDir: string | undefined;
let previousHome: string | undefined;

function createSessionRows(
  sessionId: string,
  timestamp: string,
  totalTokens: number,
  options: {
    provider?: string;
    source?: string;
    model?: string;
  } = {}
) {
  const provider = options.provider ?? "openai";
  const source = options.source ?? "vscode";
  const model = options.model ?? "gpt-5.3-codex";

  return [
    {
      timestamp,
      type: "session_meta",
      payload: {
        id: sessionId,
        model_provider: provider,
        source
      }
    },
    {
      timestamp,
      type: "turn_context",
      payload: {
        model
      }
    },
    {
      timestamp,
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          total_token_usage: {
            total_tokens: totalTokens,
            input_tokens: totalTokens - 20,
            output_tokens: 20,
            cached_input_tokens: 10
          },
          last_token_usage: {
            input_tokens: totalTokens - 20,
            output_tokens: 20,
            cached_input_tokens: 10
          }
        }
      }
    }
  ];
}

beforeEach(() => {
  previousCodexHome = process.env.CODEX_HOME;
  previousCacheDir = process.env.AGENTIC_INSIGHTS_CACHE_DIR;
  previousHome = process.env.HOME;
});

afterEach(() => {
  vi.restoreAllMocks();

  if (previousCodexHome === undefined) {
    delete process.env.CODEX_HOME;
  } else {
    process.env.CODEX_HOME = previousCodexHome;
  }

  if (previousCacheDir === undefined) {
    delete process.env.AGENTIC_INSIGHTS_CACHE_DIR;
  } else {
    process.env.AGENTIC_INSIGHTS_CACHE_DIR = previousCacheDir;
  }

  if (previousHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = previousHome;
  }
});

describe("DashboardService", () => {
  it("reuses cached day aggregations for repeated week and month requests until the snapshot changes", () => {
    const codex = createCodexHome();
    const claude = createClaudeHome();
    const cache = createCacheDir();
    process.env.CODEX_HOME = codex.dir;
    process.env.HOME = claude.homeDir;
    process.env.AGENTIC_INSIGHTS_CACHE_DIR = cache.dir;

    writeJsonlFile(codex.dir, "sessions/2026/03/09/session-a.jsonl", createSessionRows("session-a", "2026-03-09T10:00:00.000Z", 120));

    const daySpy = vi.spyOn(aggregation, "aggregateDayTimeseries");
    const bucketSpy = vi.spyOn(aggregation, "aggregateFromDayBuckets");
    const service = new DashboardService();

    const firstMonth = service.getTimeseries("month", "UTC");
    const secondMonth = service.getTimeseries("month", "UTC");
    const week = service.getTimeseries("week", "UTC");

    expect(firstMonth).toEqual(secondMonth);
    expect(firstMonth.points[0]?.tokens).toBe(120);
    expect(week.points[0]?.tokens).toBe(120);
    expect(daySpy).toHaveBeenCalledTimes(1);
    expect(bucketSpy).toHaveBeenCalledTimes(2);

    writeJsonlFile(codex.dir, "sessions/2026/03/10/session-b.jsonl", createSessionRows("session-b", "2026-03-10T10:00:00.000Z", 80));

    const refreshedMonth = service.getTimeseries("month", "UTC");

    expect(refreshedMonth.points[0]?.tokens).toBe(200);
    expect(daySpy).toHaveBeenCalledTimes(2);
    expect(bucketSpy).toHaveBeenCalledTimes(3);

    codex.cleanup();
    claude.cleanup();
    cache.cleanup();
  });

  it("groups coverage details by source and rolls dated Claude models into canonical model usage", () => {
    const codex = createCodexHome();
    const claude = createClaudeHome();
    const cache = createCacheDir();
    process.env.CODEX_HOME = codex.dir;
    process.env.HOME = claude.homeDir;
    process.env.AGENTIC_INSIGHTS_CACHE_DIR = cache.dir;

    writeJsonlFile(
      codex.dir,
      "sessions/2026/03/09/session-openai-vscode.jsonl",
      [
        ...createSessionRows("session-openai-vscode", "2026-03-09T10:00:00.000Z", 120, {
          source: "vscode",
          model: "gpt-5.3-codex"
        }),
        {
          timestamp: "2026-03-09T10:00:03.000Z",
          type: "event_msg",
          payload: {
            type: "user_message",
            message: "Explain this chart"
          }
        }
      ]
    );
    writeJsonlFile(
      codex.dir,
      "sessions/2026/03/09/session-openai-cli.jsonl",
      createSessionRows("session-openai-cli", "2026-03-09T10:05:00.000Z", 80, {
        source: "exec",
        model: "gpt-5.3-codex"
      })
    );
    writeJsonlFile(
      codex.dir,
      "sessions/2026/03/09/session-claude.jsonl",
      createSessionRows("session-claude", "2026-03-09T10:10:00.000Z", 60, {
        provider: "claude",
        source: "cli",
        model: "claude-sonnet-4-20250514"
      })
    );
    writeJsonlFile(
      codex.dir,
      "sessions/2026/03/09/session-ollama.jsonl",
      createSessionRows("session-ollama", "2026-03-09T10:15:00.000Z", 40, {
        provider: "ollama",
        source: "exec",
        model: "qwen3.5:9b"
      })
    );

    const service = new DashboardService();
    const overview = service.getOverview();

    expect(overview.coverageDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "openai",
          model: "gpt-5.3-codex",
          source: "VS Code extension",
          classification: "supported",
          tokens: 120
        }),
        expect.objectContaining({
          provider: "openai",
          model: "gpt-5.3-codex",
          source: "CLI",
          classification: "supported",
          tokens: 80
        }),
        expect.objectContaining({
          provider: "anthropic",
          model: "claude-sonnet-4",
          source: "CLI",
          classification: "supported",
          tokens: 60
        }),
        expect.objectContaining({
          provider: "ollama",
          model: "qwen3.5:9b",
          source: "CLI",
          classification: "excluded",
          tokens: 40,
          reason: "Unsupported provider: ollama"
        })
      ])
    );
    expect(overview.modelUsage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "openai",
          model: "gpt-5.3-codex",
          totalTokens: 200,
          supportedTokens: 200
        }),
        expect.objectContaining({
          provider: "anthropic",
          model: "claude-sonnet-4",
          totalTokens: 60,
          supportedTokens: 60
        })
      ])
    );

    codex.cleanup();
    claude.cleanup();
    cache.cleanup();
  });

  it("merges Claude Code usage from ~/.claude into overview totals", () => {
    const codex = createCodexHome();
    const claude = createClaudeHome();
    const cache = createCacheDir();
    process.env.CODEX_HOME = codex.dir;
    process.env.HOME = claude.homeDir;
    process.env.AGENTIC_INSIGHTS_CACHE_DIR = cache.dir;

    writeJsonlFile(codex.dir, "sessions/2026/03/09/session-openai.jsonl", createSessionRows("session-openai", "2026-03-09T10:00:00.000Z", 120));
    writeJsonlFile(claude.homeDir, ".claude/projects/project-a/session-claude.jsonl", [
      {
        type: "user",
        uuid: "prompt-1",
        timestamp: "2026-03-09T11:00:00.000Z",
        sessionId: "session-claude",
        message: {
          content: "Summarise the model output"
        }
      },
      {
        type: "assistant",
        timestamp: "2026-03-09T11:00:00.000Z",
        sessionId: "session-claude",
        message: {
          id: "msg-claude-1",
          model: "claude-sonnet-4-20250514",
          usage: {
            input_tokens: 70,
            cache_creation_input_tokens: 10,
            cache_read_input_tokens: 20,
            output_tokens: 30
          }
        }
      }
    ]);
    writeJsonFile(claude.homeDir, ".claude/usage-data/session-meta/session-fallback.json", {
      session_id: "session-fallback",
      start_time: "2026-03-09T12:00:00.000Z",
      input_tokens: 50,
      output_tokens: 10
    });

    const service = new DashboardService();
    const overview = service.getOverview();

    expect(overview.coverageSummary).toEqual({
      sessions: 3,
      prompts: 1,
      excludedModels: 1
    });
    expect(overview.tokenTotals.totalTokens).toBe(290);
    expect(overview.coverageDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "anthropic",
          model: "claude-sonnet-4",
          source: "Claude Code",
          classification: "supported",
          tokens: 110
        }),
        expect.objectContaining({
          provider: "anthropic",
          model: "unknown",
          source: "Claude Code",
          classification: "excluded",
          tokens: 60,
          reason: "Unsupported model: unknown"
        })
      ])
    );
    expect(overview.modelUsage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "anthropic",
          model: "claude-sonnet-4",
          totalTokens: 110,
          supportedTokens: 110
        }),
        expect.objectContaining({
          provider: "anthropic",
          model: "unknown",
          totalTokens: 60,
          excludedTokens: 60
        })
      ])
    );

    codex.cleanup();
    claude.cleanup();
    cache.cleanup();
  });
});
