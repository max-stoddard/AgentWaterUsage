import { LineChart, type CustomTooltipProps } from "@tremor/react";
import type { TimeseriesPoint } from "@ai-water-usage/shared";
import { formatLitres, formatNumber } from "../lib/format";

interface WaterChartProps {
  points: TimeseriesPoint[];
}

interface ChartDatum {
  label: string;
  central: number;
  low: number;
  high: number;
  tokens: number;
  excludedTokens: number;
  unestimatedTokens: number;
}

function TrendTooltip({ active, payload, label }: CustomTooltipProps) {
  const point = payload?.[0]?.payload as ChartDatum | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-stone-800 bg-stone-950 px-4 py-4 text-stone-50 shadow-[0_24px_50px_-32px_rgba(28,25,23,0.75)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">{formatLitres(point.central)}</p>
      <p className="mt-1 text-sm leading-6 text-stone-300">
        Range {formatLitres(point.low)} to {formatLitres(point.high)}
      </p>
      <p className="mt-3 text-sm text-stone-300">{formatNumber(point.tokens)} tokens</p>
      {(point.excludedTokens > 0 || point.unestimatedTokens > 0) && (
        <p className="mt-1 text-sm text-stone-400">
          {point.excludedTokens > 0 ? `${formatNumber(point.excludedTokens)} excluded` : ""}
          {point.excludedTokens > 0 && point.unestimatedTokens > 0 ? " · " : ""}
          {point.unestimatedTokens > 0 ? `${formatNumber(point.unestimatedTokens)} unestimated` : ""}
        </p>
      )}
    </div>
  );
}

export function WaterChart({ points }: WaterChartProps) {
  const chartData = points.map((point) => ({
    label: point.label,
    central: point.waterLitres.central,
    low: point.waterLitres.low,
    high: point.waterLitres.high,
    tokens: point.tokens,
    excludedTokens: point.excludedTokens,
    unestimatedTokens: point.unestimatedTokens
  }));
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="mt-8">
      {latestPoint ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="panel-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Latest central</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-stone-950">
              {formatLitres(latestPoint.waterLitres.central)}
            </p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Current range</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-stone-950">
              {formatLitres(latestPoint.waterLitres.low)} to {formatLitres(latestPoint.waterLitres.high)}
            </p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Latest tokens</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-stone-950">
              {formatNumber(latestPoint.tokens)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-stone-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,247,245,0.98))] p-4 sm:p-6">
        <LineChart
          data={chartData}
          index="label"
          categories={["central"]}
          colors={["sky"]}
          className="h-80 min-h-[20rem]"
          yAxisWidth={70}
          valueFormatter={formatLitres}
          customTooltip={TrendTooltip}
          showLegend={false}
          showAnimation={false}
          showGridLines
          curveType="monotone"
          noDataText="No water estimate available for this bucket."
          aria-label="Water usage trend"
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">
        The chart emphasizes the central estimate while keeping range detail in every point inspection. Empty buckets remain
        explicit rather than collapsing into zero.
      </p>
    </div>
  );
}
