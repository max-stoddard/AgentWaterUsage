import { formatDateTime } from "../lib/format";

interface DashboardFooterProps {
  lastIndexedAt: number | null;
  timeZone: string;
}

export function DashboardFooter({ lastIndexedAt, timeZone }: DashboardFooterProps) {
  const indexedLabel = lastIndexedAt ? formatDateTime(lastIndexedAt) : "Loading local history...";

  return (
    <footer className="mt-6 space-y-1.5 border-t border-slate-200/60 pt-4">
      <div className="flex flex-col gap-1.5 text-xs text-ink-tertiary sm:flex-row sm:items-center sm:justify-between">
        <p>Last indexed {indexedLabel}</p>
        <p className="text-xs">Local only &middot; {timeZone}</p>
      </div>
      <p className="text-center text-xs text-slate-300">Copyright Max Stoddard 2026</p>
    </footer>
  );
}
