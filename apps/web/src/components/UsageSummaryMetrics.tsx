import type { WeeklyGrowthMetric, WeeklyGrowthSummary } from "@agentic-insights/shared";
import { formatCompactNumber, formatNumber } from "../lib/format";

interface UsageSummaryMetricsProps {
  sessions: number;
  prompts: number;
  tokens: number;
  growth?: WeeklyGrowthSummary;
  compact?: boolean;
}

function formatMetric(value: number, compact: boolean): string {
  return compact ? formatCompactNumber(value) : formatNumber(value);
}

function GrowthChip({ growth, compact }: { growth: WeeklyGrowthMetric | undefined; compact: boolean }) {
  if (!growth || growth.increase <= 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.53 2.22a.75.75 0 0 0-1.06 0L3.72 5.97a.75.75 0 1 0 1.06 1.06L7.25 4.56v8.69a.75.75 0 0 0 1.5 0V4.56l2.47 2.47a.75.75 0 1 0 1.06-1.06L8.53 2.22Z"
          clipRule="evenodd"
        />
      </svg>
      <span>+{formatMetric(growth.increase, compact)} this week</span>
    </span>
  );
}

function MetricStat({
  value,
  label,
  growth,
  compact
}: {
  value: number;
  label: string;
  growth: WeeklyGrowthMetric | undefined;
  compact: boolean;
}) {
  return (
    <div className="flex min-w-[8rem] flex-1 items-baseline gap-2">
      <span className="text-2xl font-bold tracking-[-0.03em] text-ink">{formatMetric(value, compact)}</span>
      <span className="text-ink-secondary">{label}</span>
      <GrowthChip growth={growth} compact={compact} />
    </div>
  );
}

export function UsageSummaryMetrics({ sessions, prompts, tokens, growth, compact = true }: UsageSummaryMetricsProps) {
  return (
    <div className="mt-5 flex flex-col gap-4 text-sm sm:flex-row sm:items-baseline sm:gap-6">
      <MetricStat value={sessions} label="sessions" growth={growth?.sessions} compact={compact} />

      <span className="hidden h-4 w-px bg-slate-200 sm:block" />

      <MetricStat value={prompts} label="prompts" growth={growth?.prompts} compact={compact} />

      <span className="hidden h-4 w-px bg-slate-200 sm:block" />

      <MetricStat value={tokens} label="tokens" growth={growth?.tokens} compact={compact} />
    </div>
  );
}
