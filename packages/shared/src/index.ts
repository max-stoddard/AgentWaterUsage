export type Bucket = "day" | "week" | "month";

export interface WaterRange {
  low: number;
  central: number;
  high: number;
}

export interface TokenTotals {
  totalTokens: number;
  supportedTokens: number;
  excludedTokens: number;
  unestimatedTokens: number;
}

export interface CoverageCounts {
  supportedEvents: number;
  excludedEvents: number;
  tokenOnlyEvents: number;
}

export interface ExclusionSummary {
  provider: string;
  model: string;
  tokens: number;
  events: number;
  reason: string;
}

export interface CalibrationSnapshot {
  referenceEventCostUsd: number;
  computedAt: number;
  supportedEventCount: number;
  supportedMedianSource: string;
}

export interface OverviewResponse {
  tokenTotals: TokenTotals;
  waterLitres: WaterRange;
  coverage: CoverageCounts;
  exclusions: ExclusionSummary[];
  lastIndexedAt: number | null;
  calibration: CalibrationSnapshot | null;
}

export interface TimeseriesPoint {
  key: string;
  label: string;
  tokens: number;
  excludedTokens: number;
  unestimatedTokens: number;
  waterLitres: WaterRange;
}

export interface TimeseriesResponse {
  bucket: Bucket;
  points: TimeseriesPoint[];
}

export interface PricingEntry {
  provider: string;
  model: string;
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion: number;
  outputUsdPerMillion: number;
  docsUrl: string;
}

export interface MethodologyResponse {
  pricingTable: PricingEntry[];
  benchmarkCoefficients: WaterRange;
  calibration: CalibrationSnapshot | null;
  exclusions: ExclusionSummary[];
  sourceLinks: Array<{ label: string; url: string }>;
}

export interface ErrorResponse {
  error: string;
}
