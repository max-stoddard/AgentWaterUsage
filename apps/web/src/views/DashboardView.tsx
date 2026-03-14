import type { Bucket, MethodologyTabId, OverviewResponse, TimeseriesResponse } from "@agentic-insights/shared";
import { AlertBanner } from "../components/AlertBanner";
import { BucketToggle } from "../components/BucketToggle";
import { CoverageSummary } from "../components/CoverageSummary";
import { DataStatusPanel } from "../components/DataStatusPanel";
import { HeroBanner } from "../components/HeroBanner";
import { IndexingStatusCard } from "../components/IndexingStatusCard";
import { RoadmapStrip } from "../components/RoadmapStrip";
import { ScrollReveal } from "../components/ScrollReveal";
import { SkeletonBlock } from "../components/SkeletonBlock";
import { WaterScaleChart } from "../components/WaterScaleChart";
import { WaterUsageCard, WaterUsageCardSkeleton } from "../components/WaterUsageCard";
import { WaterChart } from "../components/WaterChart";

interface DashboardViewProps {
  bucket: Bucket;
  overview: OverviewResponse | null;
  overviewLoading: boolean;
  overviewError: string | null;
  timeseries: TimeseriesResponse | null;
  timeseriesLoading: boolean;
  timeseriesError: string | null;
  onBucketChange: (bucket: Bucket) => void;
  onOpenMethodology: (tab?: MethodologyTabId) => void;
}

interface UsageOverTimeSectionProps {
  bucket: Bucket;
  loading: boolean;
  error: string | null;
  timeseries: TimeseriesResponse | null;
  onBucketChange: (bucket: Bucket) => void;
}

function UsageOverTimeSection({ bucket, loading, error, timeseries, onBucketChange }: UsageOverTimeSectionProps) {
  return (
    <section className="card px-6 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-ink">Usage over time</h2>
        <BucketToggle active={bucket} onChange={onBucketChange} />
      </div>

      {loading ? (
        <div className="mt-6" data-testid="usage-over-time-skeleton">
          <SkeletonBlock className="h-72 sm:h-80" />
        </div>
      ) : error ? (
        <div className="mt-6" data-testid="usage-over-time-error">
          <AlertBanner title="Could not load usage over time">{error}</AlertBanner>
        </div>
      ) : timeseries ? (
        <WaterChart points={timeseries.points} />
      ) : null}
    </section>
  );
}

function hasOverviewContent(overview: OverviewResponse): boolean {
  return (
    overview.tokenTotals.totalTokens > 0 ||
    overview.coverageSummary.sessions > 0 ||
    overview.coverageSummary.prompts > 0 ||
    overview.modelUsage.length > 0 ||
    overview.coverageDetails.length > 0 ||
    overview.exclusions.length > 0 ||
    overview.lastIndexedAt !== null ||
    overview.calibration !== null
  );
}

const INITIAL_INDEXING_PLACEHOLDER: NonNullable<OverviewResponse["indexing"]> = {
  phase: "discovering",
  startedAt: 0,
  updatedAt: 0
};

export function DashboardView({
  bucket,
  overview,
  overviewLoading,
  overviewError,
  timeseries,
  timeseriesLoading,
  timeseriesError,
  onBucketChange,
  onOpenMethodology
}: DashboardViewProps) {
  const ready = overview?.diagnostics.state === "ready";
  const indexing = overview?.diagnostics.state === "indexing";
  const overviewHasContent = overview ? hasOverviewContent(overview) : false;
  const showNotReady = overview && !ready && !indexing;
  const showData = overview && (ready || (indexing && overviewHasContent));
  const showOverviewSkeleton = (!overview && (overviewLoading || !overviewError)) || (Boolean(indexing) && !overviewHasContent);
  const showOverviewError = !overview && overviewError;
  const indexingCardState = overview?.indexing ?? (!overview && overviewLoading && !overviewError ? INITIAL_INDEXING_PLACEHOLDER : null);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-4">
        <HeroBanner />
        <IndexingStatusCard indexing={indexingCardState} />
      </div>

      {showOverviewError ? (
        <AlertBanner title="Something went wrong">{overviewError}</AlertBanner>
      ) : showOverviewSkeleton ? (
        <>
          <WaterUsageCardSkeleton />
          <SkeletonBlock className="h-[34rem]" data-testid="water-scale-skeleton" />
          <UsageOverTimeSection bucket={bucket} loading error={null} timeseries={null} onBucketChange={onBucketChange} />
          <SkeletonBlock className="h-96" data-testid="coverage-summary-skeleton" />
        </>
      ) : showNotReady ? (
        <ScrollReveal>
          <DataStatusPanel diagnostics={overview.diagnostics} />
        </ScrollReveal>
      ) : showData ? (
        <>
          <ScrollReveal>
            <WaterUsageCard overview={overview} onOpenMethodology={() => onOpenMethodology("water")} />
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <WaterScaleChart waterLitres={overview.waterLitres} />
          </ScrollReveal>

          <ScrollReveal delayMs={160}>
            <UsageOverTimeSection
              bucket={bucket}
              loading={!timeseries && (timeseriesLoading || !timeseriesError)}
              error={timeseries ? null : timeseriesError}
              timeseries={timeseries}
              onBucketChange={onBucketChange}
            />
          </ScrollReveal>

          <ScrollReveal delayMs={240}>
            <CoverageSummary overview={overview} onOpenMethodology={onOpenMethodology} />
          </ScrollReveal>
        </>
      ) : null}

      <ScrollReveal delayMs={320}>
        <RoadmapStrip />
      </ScrollReveal>
    </div>
  );
}
