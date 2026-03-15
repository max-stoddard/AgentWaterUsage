import type { KeyboardEvent } from "react";
import { IMPACT_METRIC_DEFINITION, IMPACT_METRIC_ORDER, type ImpactMetric } from "../lib/footprint";
import { FootprintIcon } from "./FootprintIcon";

interface ImpactMetricToggleProps {
  active: ImpactMetric;
  onChange: (metric: ImpactMetric) => void;
}

function nextIndex(index: number, direction: 1 | -1): number {
  return (index + direction + IMPACT_METRIC_ORDER.length) % IMPACT_METRIC_ORDER.length;
}

function activeClasses(metric: ImpactMetric): string {
  if (metric === "water") {
    return "bg-white text-sky-700";
  }

  if (metric === "energy") {
    return "bg-white text-amber-700";
  }

  return "bg-white text-slate-700";
}

export function ImpactMetricToggle({ active, onChange }: ImpactMetricToggleProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onChange(IMPACT_METRIC_ORDER[nextIndex(index, 1)]!);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(IMPACT_METRIC_ORDER[nextIndex(index, -1)]!);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      onChange(IMPACT_METRIC_ORDER[0]!);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      onChange(IMPACT_METRIC_ORDER[IMPACT_METRIC_ORDER.length - 1]!);
    }
  };

  return (
    <div role="tablist" aria-label="Impact metric" className="inline-flex self-start rounded-lg bg-surface-muted p-1">
      {IMPACT_METRIC_ORDER.map((metric, index) => {
        const selected = metric === active;
        const definition = IMPACT_METRIC_DEFINITION[metric];

        return (
          <button
            key={metric}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(metric)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={
              selected
                ? `inline-flex min-w-[6.5rem] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-all ${activeClasses(metric)}`
                : "inline-flex min-w-[6.5rem] items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-ink-secondary transition-all hover:text-ink"
            }
          >
            <span className={definition.tone === "carbon" ? "text-footprint-carbon" : definition.tone === "energy" ? "text-footprint-energy" : "text-footprint-water"}>
              <FootprintIcon property={metric} className="h-4 w-4" />
            </span>
            <span>{definition.label}</span>
          </button>
        );
      })}
    </div>
  );
}
