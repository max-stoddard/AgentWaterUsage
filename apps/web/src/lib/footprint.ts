import type { OverviewResponse, TimeseriesPoint } from "@agentic-insights/shared";
import { formatCarbon, formatEnergy, formatLitres } from "./format";

export type FootprintProperty = "water" | "energy" | "carbon" | "token";
export type ImpactMetric = Extract<FootprintProperty, "water" | "energy" | "carbon">;
export type ImpactCardTone = Extract<ImpactMetric, "water" | "energy" | "carbon">;

export const FOOTPRINT_TEXT_CLASS_BY_PROPERTY: Record<FootprintProperty, string> = {
  water: "text-footprint-water",
  energy: "text-footprint-energy",
  carbon: "text-footprint-carbon",
  token: "text-footprint-token"
};

export interface ImpactMetricDefinition {
  label: string;
  tone: ImpactCardTone;
  eyebrow: string;
  buttonLabel: string;
  emptyStateLabel: string;
  formatter: (value: number) => string;
}

export const IMPACT_METRIC_DEFINITION: Record<ImpactMetric, ImpactMetricDefinition> = {
  water: {
    label: "Water",
    tone: "water",
    eyebrow: "Total Agent Water Usage",
    buttonLabel: "How is water calculated?",
    emptyStateLabel: "water",
    formatter: formatLitres
  },
  energy: {
    label: "Energy",
    tone: "energy",
    eyebrow: "Total Agent Energy Usage",
    buttonLabel: "How is energy calculated?",
    emptyStateLabel: "energy",
    formatter: formatEnergy
  },
  carbon: {
    label: "Carbon",
    tone: "carbon",
    eyebrow: "Total Agent Carbon Usage",
    buttonLabel: "How is carbon calculated?",
    emptyStateLabel: "carbon",
    formatter: formatCarbon
  }
};

export const IMPACT_METRIC_ORDER: ImpactMetric[] = ["water", "energy", "carbon"];

export function getImpactMetricValue(metric: ImpactMetric, source: Pick<OverviewResponse, "waterLitres" | "energyKwh" | "carbonKgCo2">): number;
export function getImpactMetricValue(
  metric: ImpactMetric,
  source: Pick<TimeseriesPoint, "waterLitres" | "energyKwh" | "carbonKgCo2">
): number;
export function getImpactMetricValue(
  metric: ImpactMetric,
  source: Pick<OverviewResponse, "waterLitres" | "energyKwh" | "carbonKgCo2"> | Pick<TimeseriesPoint, "waterLitres" | "energyKwh" | "carbonKgCo2">
): number {
  if (metric === "water") {
    return source.waterLitres.central;
  }

  if (metric === "energy") {
    return source.energyKwh;
  }

  return source.carbonKgCo2;
}
