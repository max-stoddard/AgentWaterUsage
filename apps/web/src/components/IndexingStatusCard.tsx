import type { IndexingStatus } from "@agentic-insights/shared";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

const EXIT_DURATION_MS = 280;

const INDEXING_LABEL_BY_PHASE: Record<IndexingStatus["phase"], string> = {
  discovering: "Scanning local usage files",
  parsing: "Reading session history",
  estimating: "Estimating water, energy, and carbon",
  finalizing: "Preparing your dashboard"
};

interface IndexingStatusCardProps {
  indexing: IndexingStatus | null;
}

export function IndexingStatusCard({ indexing }: IndexingStatusCardProps) {
  const reducedMotion = useReducedMotion();
  const [visibleIndexing, setVisibleIndexing] = useState(indexing);
  const [closing, setClosing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (indexing) {
      setVisibleIndexing(indexing);
      setClosing(false);
      return;
    }

    if (!visibleIndexing) {
      return;
    }

    if (reducedMotion) {
      setVisibleIndexing(null);
      setClosing(false);
      return;
    }

    setClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      setVisibleIndexing(null);
      setClosing(false);
      timeoutRef.current = null;
    }, EXIT_DURATION_MS);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [indexing, reducedMotion, visibleIndexing]);

  if (!visibleIndexing) {
    return null;
  }

  const label = INDEXING_LABEL_BY_PHASE[visibleIndexing.phase];

  return (
    <div
      aria-live="polite"
      className={["indexing-status-shell", closing ? "indexing-status-shell-closing" : undefined].filter(Boolean).join(" ")}
      data-testid="indexing-status-shell"
    >
      <section
        className="card indexing-status-card relative overflow-hidden px-5 py-3 sm:px-6 sm:py-3.5"
        data-testid="indexing-status-card"
      >
        <div className="absolute inset-y-0 left-0 w-24 bg-[radial-gradient(circle_at_left,rgba(13,148,136,0.14),transparent_74%)]" />
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-left">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-700/80">Indexing</p>
              <h2 className="mt-0.5 text-sm font-semibold leading-snug text-ink">{label}</h2>
            </div>
            <span className="pill border border-teal-200/70 bg-teal-50/90 py-0.5 text-[11px] text-teal-700">Local only</span>
          </div>

          <div aria-label={label} className="indexing-progress-track h-1.5 rounded-full bg-teal-100/85" role="progressbar">
            <span className={["indexing-progress-fill", reducedMotion ? "indexing-progress-fill-reduced" : undefined].filter(Boolean).join(" ")} />
          </div>
        </div>
      </section>
    </div>
  );
}
