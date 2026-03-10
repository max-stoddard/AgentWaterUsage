import { formatDateTime } from "../lib/format";

interface DashboardFooterProps {
  lastIndexedAt: number | null;
  timeZone: string;
}

export function DashboardFooter({ lastIndexedAt, timeZone }: DashboardFooterProps) {
  const indexedLabel = lastIndexedAt ? formatDateTime(lastIndexedAt) : "Loading local history...";

  return (
    <footer className="panel-muted flex flex-col gap-3 px-5 py-4 text-sm text-stone-600 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
      <p className="font-medium text-stone-700">Copyright Max Stoddard 2026</p>
      <div className="text-left lg:text-right">
        <p className="font-medium text-stone-700">Last indexed {indexedLabel}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">Browser timezone {timeZone}</p>
      </div>
    </footer>
  );
}
