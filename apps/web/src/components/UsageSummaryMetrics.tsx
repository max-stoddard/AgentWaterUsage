import { formatCompactNumber, formatNumber } from "../lib/format";

interface UsageSummaryMetricsProps {
  sessions: number;
  prompts: number;
  tokens: number;
  compact?: boolean;
}

function formatMetric(value: number, compact: boolean): string {
  return compact ? formatCompactNumber(value) : formatNumber(value);
}

export function UsageSummaryMetrics({ sessions, prompts, tokens, compact = true }: UsageSummaryMetricsProps) {
  return (
    <div className="mt-5 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-[-0.03em] text-ink">{formatMetric(sessions, compact)}</span>
        <span className="text-ink-secondary">sessions</span>
      </div>

      <span className="hidden h-4 w-px bg-slate-200 sm:block" />

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-[-0.03em] text-ink">{formatMetric(prompts, compact)}</span>
        <span className="text-ink-secondary">prompts</span>
      </div>

      <span className="hidden h-4 w-px bg-slate-200 sm:block" />

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-[-0.03em] text-ink">{formatMetric(tokens, compact)}</span>
        <span className="text-ink-secondary">tokens</span>
      </div>
    </div>
  );
}
