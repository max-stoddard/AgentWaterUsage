import { useState } from "react";
import type { OverviewResponse } from "@agentic-insights/shared";
import { formatCompactNumber, formatNumber } from "../lib/format";

interface CoverageSummaryProps {
  overview: OverviewResponse;
  onOpenMethodology: () => void;
}

export function CoverageSummary({ overview, onOpenMethodology }: CoverageSummaryProps) {
  const [showAllSources, setShowAllSources] = useState(false);
  const hasDetails = overview.coverageDetails.length > 0;
  const topDetails = overview.coverageDetails.slice(0, 3);
  const remainingDetails = overview.coverageDetails.slice(3);

  function renderDetailCard(item: OverviewResponse["coverageDetails"][number]) {
    return (
      <div
        key={`${item.provider}:${item.model}:${item.source}:${item.classification}:${item.reason ?? "supported"}`}
        className="flex items-start gap-3 rounded-lg bg-surface-muted px-4 py-3"
      >
        <div
          className={`mt-0.5 h-8 w-1 flex-shrink-0 rounded-full ${
            item.classification === "supported"
              ? "bg-emerald-500"
              : item.classification === "excluded"
                ? "bg-accent"
                : "bg-ink-tertiary"
          }`}
        />
        <div>
          <p className="text-sm font-medium text-ink">
            {item.provider} / {item.model}
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">
            {item.source} · {formatNumber(item.tokens)} tokens
            {item.reason ? ` — ${item.reason.toLowerCase()}` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="card px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Usage breakdown</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
            See how many prompts and sessions were counted, how many tokens are included in the estimate, and which
            model sources are driving the total.
          </p>
        </div>
        <button
          type="button"
          className="pill transition-colors hover:bg-accent-muted hover:text-accent-hover"
          onClick={onOpenMethodology}
        >
          How it works
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-[-0.03em] text-ink">
            {formatCompactNumber(overview.coverageSummary.sessions)}
          </span>
          <span className="text-ink-secondary">sessions</span>
        </div>

        <span className="hidden h-4 w-px bg-slate-200 sm:block" />

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-[-0.03em] text-ink">
            {formatCompactNumber(overview.coverageSummary.prompts)}
          </span>
          <span className="text-ink-secondary">prompts</span>
        </div>

        <span className="hidden h-4 w-px bg-slate-200 sm:block" />

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-[-0.03em] text-ink">
            {formatCompactNumber(overview.tokenTotals.supportedTokens)}
          </span>
          <span className="text-ink-secondary">tokens</span>
        </div>
      </div>

      {hasDetails ? (
        <div className="mt-5">
          <div className="space-y-2">
            {topDetails.map(renderDetailCard)}
          </div>

          {remainingDetails.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowAllSources(!showAllSources)}
                className="flex items-center gap-1.5 text-sm font-medium text-accent no-underline transition-colors hover:text-accent-hover"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${showAllSources ? "rotate-90" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
                {showAllSources ? "Show fewer sources" : "Show all model sources"}
              </button>

              {showAllSources ? <div className="mt-3 space-y-2">{remainingDetails.map(renderDetailCard)}</div> : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-secondary">
          No model sources have been indexed yet.
        </p>
      )}
    </section>
  );
}
