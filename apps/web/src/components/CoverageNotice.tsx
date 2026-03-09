import type { OverviewResponse } from "@ai-water-usage/shared";
import { formatNumber } from "../lib/format";

interface CoverageNoticeProps {
  overview: OverviewResponse;
}

export function CoverageNotice({ overview }: CoverageNoticeProps) {
  const hasExceptions = overview.exclusions.length > 0 || overview.tokenTotals.unestimatedTokens > 0;

  return (
    <section className="panel-shell px-6 py-6 sm:px-8 sm:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Coverage</p>
          <h2 className="mt-3 section-heading">What counts toward the estimate</h2>
        </div>
        <div className="micro-pill">{formatNumber(overview.coverage.supportedEvents)} supported</div>
      </div>

      <p className="mt-4 section-copy">
        Supported OpenAI events are priced and converted into a water estimate. Unsupported providers, models, and
        fallback-only token totals remain visible but do not contribute to the final litres.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="panel-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Supported</p>
          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-stone-950">
            {formatNumber(overview.coverage.supportedEvents)}
          </p>
          <p className="mt-1 text-sm text-stone-600">events with pricing coverage</p>
        </div>
        <div className="panel-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Excluded</p>
          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-stone-950">
            {formatNumber(overview.coverage.excludedEvents)}
          </p>
          <p className="mt-1 text-sm text-stone-600">events omitted from litres</p>
        </div>
        <div className="panel-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Token only</p>
          <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-stone-950">
            {formatNumber(overview.coverage.tokenOnlyEvents)}
          </p>
          <p className="mt-1 text-sm text-stone-600">sessions without split token data</p>
        </div>
      </div>

      {hasExceptions ? (
        <div className="mt-8 space-y-3">
          {overview.exclusions.map((item) => (
            <div
              key={`${item.provider}:${item.model}`}
              className="rounded-[24px] border border-stone-200 bg-white px-4 py-4 shadow-[0_16px_40px_-34px_rgba(28,25,23,0.28)]"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 h-10 w-1 rounded-full bg-cyan-400" />
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {item.provider} / {item.model}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {formatNumber(item.tokens)} tokens excluded because {item.reason.toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>
          ))}
          {overview.tokenTotals.unestimatedTokens > 0 ? (
            <div className="rounded-[24px] border border-stone-200 bg-white px-4 py-4 shadow-[0_16px_40px_-34px_rgba(28,25,23,0.28)]">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-10 w-1 rounded-full bg-stone-300" />
                <div>
                  <p className="text-sm font-semibold text-stone-950">Fallback-only sessions</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {formatNumber(overview.tokenTotals.unestimatedTokens)} tokens were recovered from TUI totals without split
                    token data, so they remain unestimated.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-cyan-100 bg-cyan-50/80 px-4 py-4 text-sm leading-6 text-stone-700">
          Everything parsed so far has pricing coverage and split-token data.
        </div>
      )}
    </section>
  );
}
