import type { OverviewResponse } from "@agentic-insights/shared";
import { formatCompactNumber } from "../lib/format";
import { IMPACT_METRIC_DEFINITION, getImpactMetricValue, type ImpactMetric } from "../lib/footprint";
import { FootprintIcon } from "./FootprintIcon";
import { MetricCard } from "./MetricCard";
import { SkeletonBlock } from "./SkeletonBlock";

interface FootprintUsageCardProps {
  kind: ImpactMetric;
  overview: OverviewResponse;
  onOpenMethodology: () => void;
}

const WATER_ESTIMATION_FOOTER = "Estimated using the latest peer-reviewed research.";
const CARBON_ESTIMATION_FOOTER = "Your usage data stays on this device. Nothing is uploaded.";

function formatPromptCoverage(prompts: number): string {
  const value = formatCompactNumber(prompts);
  return `Based on ${value} of your ${prompts === 1 ? "prompt" : "prompts"}`;
}

function actionClasses(kind: ImpactMetric): string {
  if (kind === "water") {
    return "inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15";
  }

  if (kind === "energy") {
    return "inline-flex items-center gap-1.5 rounded-lg bg-amber-950/10 px-3 py-2 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-950/15";
  }

  return "inline-flex items-center gap-1.5 rounded-lg bg-slate-900/10 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-900/15";
}

function iconClasses(kind: ImpactMetric): string {
  if (kind === "water") {
    return "text-sky-200";
  }

  if (kind === "energy") {
    return "text-amber-700";
  }

  return "text-slate-600";
}

function footerLabel(kind: ImpactMetric, overview: OverviewResponse): string {
  if (kind === "water") {
    return WATER_ESTIMATION_FOOTER;
  }

  if (kind === "energy") {
    return formatPromptCoverage(overview.coverageSummary.prompts);
  }

  return CARBON_ESTIMATION_FOOTER;
}

function FootprintUsageCard({ kind, overview, onOpenMethodology }: FootprintUsageCardProps) {
  const metric = IMPACT_METRIC_DEFINITION[kind];

  return (
    <MetricCard
      eyebrow={metric.eyebrow}
      eyebrowClassName="text-base sm:text-lg"
      value={
        <span className="inline-flex items-center gap-3">
          <span className={iconClasses(kind)} data-testid={`${kind}-usage-icon`}>
            <FootprintIcon property={kind} className="h-4 w-4" />
          </span>
          <span>{metric.formatter(getImpactMetricValue(kind, overview))}</span>
        </span>
      }
      detail={null}
      footer={
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{footerLabel(kind, overview)}</span>
          <button type="button" onClick={onOpenMethodology} className={`${actionClasses(kind)} self-start`}>
            {metric.buttonLabel}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      }
      tone={metric.tone}
    />
  );
}

function FootprintUsageCardSkeleton({ kind }: { kind: ImpactMetric }) {
  const metric = IMPACT_METRIC_DEFINITION[kind];

  return (
    <div data-testid={`${kind}-usage-card-skeleton`}>
      <MetricCard
        eyebrow={metric.eyebrow}
        eyebrowClassName="text-base sm:text-lg"
        value={
          <div className="max-w-[22rem]">
            <SkeletonBlock
              className="h-10 w-40 rounded-full sm:h-12 sm:w-52 lg:h-14 lg:w-60"
              tone={kind === "water" ? "inverse" : "default"}
              data-testid={`${kind}-usage-value-skeleton`}
            />
          </div>
        }
        detail={null}
        footer={
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonBlock className="h-4 w-64 max-w-full rounded-full" tone={kind === "water" ? "inverse" : "default"} />
            <SkeletonBlock className="h-9 w-48 max-w-full rounded-lg" tone={kind === "water" ? "inverse" : "default"} />
          </div>
        }
        tone={metric.tone}
      />
    </div>
  );
}

export function WaterUsageCard({ overview, onOpenMethodology }: Omit<FootprintUsageCardProps, "kind">) {
  return <FootprintUsageCard kind="water" overview={overview} onOpenMethodology={onOpenMethodology} />;
}

export function EnergyUsageCard({ overview, onOpenMethodology }: Omit<FootprintUsageCardProps, "kind">) {
  return <FootprintUsageCard kind="energy" overview={overview} onOpenMethodology={onOpenMethodology} />;
}

export function CarbonUsageCard({ overview, onOpenMethodology }: Omit<FootprintUsageCardProps, "kind">) {
  return <FootprintUsageCard kind="carbon" overview={overview} onOpenMethodology={onOpenMethodology} />;
}

export function UsageCardsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="usage-cards-skeleton">
      <div className="lg:col-span-2">
        <FootprintUsageCardSkeleton kind="water" />
      </div>
      <FootprintUsageCardSkeleton kind="energy" />
      <FootprintUsageCardSkeleton kind="carbon" />
    </div>
  );
}
