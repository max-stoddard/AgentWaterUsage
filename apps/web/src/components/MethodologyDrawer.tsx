import { useEffect, useRef, useState } from "react";
import type { MethodologyResponse, OverviewResponse } from "@agentic-insights/shared";
import { formatLitres, formatNumber } from "../lib/format";
import { SkeletonBlock } from "./SkeletonBlock";

interface MethodologyDrawerProps {
  open: boolean;
  methodology: MethodologyResponse | null;
  overview: OverviewResponse | null;
  loading: boolean;
  onClose: () => void;
}

type MethodologyTab = "prompts" | "water" | "energy" | "carbon";

const tabs: Array<{ id: MethodologyTab; label: string }> = [
  { id: "prompts", label: "Prompts" },
  { id: "water", label: "Water" },
  { id: "energy", label: "Energy" },
  { id: "carbon", label: "Carbon" }
];

export function MethodologyDrawer({ open, methodology, overview, loading, onClose }: MethodologyDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<MethodologyTab>("prompts");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveTab("prompts");
    }
  }, [open]);

  if (!open) return null;

  const hasExceptions = overview
    ? overview.exclusions.length > 0 || overview.tokenTotals.unestimatedTokens > 0
    : false;
  const topModelSources = overview?.coverageDetails.slice(0, 3) ?? [];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="How it works"
        tabIndex={-1}
        className="absolute bottom-0 right-0 top-0 flex w-full max-w-lg flex-col bg-white shadow-2xl outline-none transition-transform duration-300"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-ink">How it works</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading || !methodology ? (
            <div className="space-y-4">
              <SkeletonBlock className="h-20" />
              <SkeletonBlock className="h-32" />
              <SkeletonBlock className="h-48" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="inline-flex rounded-lg bg-surface-muted p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.id ? "bg-white text-ink shadow-sm" : "text-ink-secondary hover:text-ink"
                    }`}
                    aria-pressed={activeTab === tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "prompts" ? (
                <div className="space-y-6">
                  <section>
                    <p className="text-[15px] leading-relaxed text-ink-secondary">
                      Prompts show how much local agent activity the dashboard could read, even when some models could
                      not be priced for water estimates yet.
                    </p>
                  </section>

                  <section>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">Sessions</p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatNumber(overview?.coverageSummary.sessions ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">Prompts</p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatNumber(overview?.coverageSummary.prompts ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">Excluded models</p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {formatNumber(overview?.coverageSummary.excludedModels ?? 0)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">What counts</h3>
                    <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-secondary">
                      <p>
                        Sessions are distinct Codex and Claude Code runs. Prompts count readable user turns from local
                        logs, not just the turns that had enough token detail for water estimation.
                      </p>
                      <p>
                        Model sources are grouped by provider, model, and where the activity came from. The card shows
                        the heaviest model sources first so you can spot what is driving token usage quickly.
                      </p>
                    </div>
                  </section>

                  {topModelSources.length > 0 ? (
                    <section>
                      <h3 className="text-sm font-semibold text-ink">Top model sources</h3>
                      <div className="mt-3 space-y-2">
                        {topModelSources.map((item) => (
                          <div
                            key={`${item.provider}:${item.model}:${item.source}`}
                            className="rounded-lg bg-surface-muted px-4 py-3"
                          >
                            <p className="text-sm font-medium text-ink">
                              {item.provider} / {item.model}
                            </p>
                            <p className="mt-0.5 text-sm text-ink-secondary">
                              {item.source} · {formatNumber(item.tokens)} tokens
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {overview && hasExceptions ? (
                    <section>
                      <h3 className="text-sm font-semibold text-ink">Why exclusions happen</h3>
                      <div className="mt-3 space-y-2">
                        {overview.exclusions.map((item) => (
                          <div key={`${item.provider}:${item.model}:${item.source}`} className="flex items-start gap-3 rounded-lg bg-surface-muted px-4 py-3">
                            <div className="mt-0.5 h-8 w-1 flex-shrink-0 rounded-full bg-accent" />
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {item.provider} / {item.model}
                              </p>
                              <p className="mt-0.5 text-sm text-ink-secondary">
                                {item.source} · {formatNumber(item.tokens)} tokens — {item.reason.toLowerCase()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "water" ? (
                <div className="space-y-8">
                  <section>
                    <p className="text-[15px] leading-relaxed text-ink-secondary">
                      Water estimates are calculated from your local coding agent token activity using pricing-weighted
                      normalization and published benchmark coefficients.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">Formulas</h3>
                    <div className="mt-3 space-y-2">
                      <code className="block overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs leading-6 text-slate-100">
                        eventCostUsd = input/1e6 * inputPrice + cachedInput/1e6 * cachedInputPrice + output/1e6 * outputPrice
                      </code>
                      <code className="block overflow-x-auto rounded-lg bg-surface-muted px-4 py-3 text-xs leading-6 text-ink-secondary">
                        waterLitres = eventCostUsd / referenceEventCostUsd * benchmarkCoefficient
                      </code>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">Benchmark coefficients</h3>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">Low</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatLitres(methodology.benchmarkCoefficients.low)}</p>
                      </div>
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">Central</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatLitres(methodology.benchmarkCoefficients.central)}</p>
                      </div>
                      <div className="rounded-lg bg-surface-muted px-3 py-3">
                        <p className="text-xs text-ink-tertiary">High</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatLitres(methodology.benchmarkCoefficients.high)}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">Calibration</h3>
                    <div className="mt-3 rounded-lg bg-surface-muted px-4 py-3">
                      {methodology.calibration ? (
                        <p className="text-sm leading-relaxed text-ink-secondary">
                          Median event cost: {methodology.calibration.referenceEventCostUsd.toFixed(6)} USD across{" "}
                          {formatNumber(methodology.calibration.supportedEventCount)} supported events.
                        </p>
                      ) : (
                        <p className="text-sm leading-relaxed text-ink-secondary">
                          No supported events available for calibration yet.
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-ink">Pricing table</h3>
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200/60">
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead className="bg-surface-muted text-xs font-medium text-ink-secondary">
                            <tr>
                              <th className="px-3 py-2.5 font-medium">Model</th>
                              <th className="px-3 py-2.5 font-medium">Input</th>
                              <th className="px-3 py-2.5 font-medium">Cached</th>
                              <th className="px-3 py-2.5 font-medium">Output</th>
                            </tr>
                          </thead>
                          <tbody>
                            {methodology.pricingTable.map((entry) => (
                              <tr key={entry.model} className="border-t border-slate-200/60">
                                <td className="px-3 py-2.5 font-medium text-ink">{entry.model}</td>
                                <td className="px-3 py-2.5 text-ink-secondary">${entry.inputUsdPerMillion}</td>
                                <td className="px-3 py-2.5 text-ink-secondary">${entry.cachedInputUsdPerMillion}</td>
                                <td className="px-3 py-2.5 text-ink-secondary">${entry.outputUsdPerMillion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  {overview && hasExceptions ? (
                    <section>
                      <h3 className="text-sm font-semibold text-ink">Exclusions</h3>
                      <div className="mt-3 space-y-2">
                        {overview.exclusions.map((item) => (
                          <div key={`${item.provider}:${item.model}:${item.source}`} className="flex items-start gap-3 rounded-lg bg-surface-muted px-4 py-3">
                            <div className="mt-0.5 h-8 w-1 flex-shrink-0 rounded-full bg-accent" />
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {item.provider} / {item.model}
                              </p>
                              <p className="mt-0.5 text-sm text-ink-secondary">
                                {item.source} · {formatNumber(item.tokens)} tokens — {item.reason.toLowerCase()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {overview.tokenTotals.unestimatedTokens > 0 ? (
                          <div className="flex items-start gap-3 rounded-lg bg-surface-muted px-4 py-3">
                            <div className="mt-0.5 h-8 w-1 flex-shrink-0 rounded-full bg-ink-tertiary" />
                            <div>
                              <p className="text-sm font-medium text-ink">Fallback-only sessions</p>
                              <p className="mt-0.5 text-sm text-ink-secondary">
                                {formatNumber(overview.tokenTotals.unestimatedTokens)} tokens without split data
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  {methodology.sourceLinks.length > 0 ? (
                    <section>
                      <h3 className="text-sm font-semibold text-ink">Sources</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {methodology.sourceLinks.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="pill no-underline transition-colors hover:bg-accent-muted hover:text-accent-hover"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "energy" ? (
                <section className="space-y-3">
                  <p className="text-[15px] leading-relaxed text-ink-secondary">
                    Energy estimates are not live yet. This tab will eventually explain how token activity maps to an
                    electricity estimate without hiding the uncertainty behind the calculation.
                  </p>
                  <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm leading-relaxed text-ink-secondary">
                    For now, water is the only fully implemented footprint estimate in this dashboard.
                  </div>
                </section>
              ) : null}

              {activeTab === "carbon" ? (
                <section className="space-y-3">
                  <p className="text-[15px] leading-relaxed text-ink-secondary">
                    Carbon estimates are also still upcoming. When this lands, it will sit alongside water and energy
                    so you can compare the same local usage across multiple footprint views.
                  </p>
                  <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm leading-relaxed text-ink-secondary">
                    Nothing is being estimated for carbon yet, so this tab is intentionally descriptive rather than
                    formula-driven.
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
