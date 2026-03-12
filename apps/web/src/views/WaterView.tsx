import type { Bucket, OverviewResponse, TimeseriesResponse } from "@agentic-insights/shared";
import { AlertBanner } from "../components/AlertBanner";
import { BucketToggle } from "../components/BucketToggle";
import { CoverageSummary } from "../components/CoverageSummary";
import { DashboardFooter } from "../components/DashboardFooter";
import { DataStatusPanel } from "../components/DataStatusPanel";
import { MetricCard } from "../components/MetricCard";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { WaterChart } from "../components/WaterChart";
import { formatLitres, formatNumber } from "../lib/format";

interface WaterViewProps {
  bucket: Bucket;
  error: string | null;
  loading: boolean;
  overview: OverviewResponse | null;
  timeseries: TimeseriesResponse | null;
  timeZone: string;
  onBucketChange: (bucket: Bucket) => void;
  onOpenMethodology: () => void;
}

function LoadingWaterView() {
  return (
    <section className="space-y-4" aria-label="Loading dashboard">
      <SkeletonBlock className="h-40" />
      <div className="grid gap-4 lg:grid-cols-8">
        <SkeletonBlock className="h-52 lg:col-span-5" />
        <SkeletonBlock className="h-52 lg:col-span-3" />
      </div>
      <SkeletonBlock className="h-[28rem]" />
      <SkeletonBlock className="h-64" />
    </section>
  );
}

export function WaterView({
  bucket,
  error,
  loading,
  overview,
  timeseries,
  timeZone,
  onBucketChange,
  onOpenMethodology
}: WaterViewProps) {
  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <section className="panel-shell relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="max-w-3xl">
            <div className="micro-pill">Water</div>
            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.06em] text-zinc-900 sm:text-3xl">Track your water estimate</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
              This view keeps the current water estimate, range, and trend in one place while leaving unsupported and
              unestimated activity visible.
            </p>
          </div>

          <div className="panel-muted p-5">
            <p className="section-kicker">Estimate basis</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-500">
              <p>Water is inferred from supported token activity and pricing-weighted normalization.</p>
              <p>Low, central, and high ranges stay available on every trend point.</p>
              <p>Methodology remains available without leaving the dashboard flow.</p>
            </div>
          </div>
        </div>
      </section>

      {error ? <AlertBanner title="Failed to load water data">{error}</AlertBanner> : null}

      {loading || !overview ? (
        <LoadingWaterView />
      ) : overview.diagnostics.state !== "ready" ? (
        <DataStatusPanel diagnostics={overview.diagnostics} />
      ) : !timeseries ? (
        <LoadingWaterView />
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-8">
            <MetricCard
              eyebrow="Current water estimate"
              title="Estimated litres"
              value={formatLitres(overview.waterLitres.central)}
              detail={`Range ${formatLitres(overview.waterLitres.low)} to ${formatLitres(overview.waterLitres.high)}`}
              footer={<span>Local calibration uses fixed benchmark coefficients.</span>}
              tone="feature"
              className="lg:col-span-5"
            />
            <MetricCard
              eyebrow="All parsed tokens"
              title="Usage coverage"
              value={formatNumber(overview.tokenTotals.totalTokens)}
              detail={`${formatNumber(overview.tokenTotals.supportedTokens)} supported · ${formatNumber(
                overview.tokenTotals.excludedTokens
              )} excluded · ${formatNumber(overview.tokenTotals.unestimatedTokens)} unestimated`}
              footer={<span>Only supported events with split token data contribute to water.</span>}
              className="lg:col-span-3"
            />
          </section>

          <section className="panel-shell px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="section-kicker">Trend</p>
                <h2 className="mt-3 section-heading">Water usage by {bucket}</h2>
                <p className="mt-4 section-copy">
                  The chart keeps the central estimate prominent while preserving the full range and visible non-estimated
                  token counts for each point.
                </p>
              </div>
              <BucketToggle active={bucket} onChange={onBucketChange} />
            </div>
            <WaterChart points={timeseries.points} />
          </section>

          <CoverageSummary overview={overview} onOpenMethodology={onOpenMethodology} />
        </>
      )}

      <DashboardFooter lastIndexedAt={overview?.lastIndexedAt ?? null} timeZone={timeZone} />
    </div>
  );
}
