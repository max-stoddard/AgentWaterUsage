import type { ModelUsageEntry } from "@agentic-insights/shared";
import { formatNumber } from "../lib/format";

interface ModelUsageListProps {
  items: ModelUsageEntry[];
}

function getAccentClass(item: ModelUsageEntry): string {
  if (item.status === "allowed") {
    return "bg-emerald-500";
  }

  if (item.status === "local") {
    return "bg-amber-400";
  }

  return "bg-accent";
}

function formatBreakdown(item: ModelUsageEntry): string {
  return item.statusNote ? `${formatNumber(item.totalTokens)} tokens · ${item.statusNote}` : `${formatNumber(item.totalTokens)} tokens`;
}

export function ModelUsageList({ items }: ModelUsageListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.provider}:${item.model}`} className="flex items-start gap-3 rounded-lg bg-surface-muted px-4 py-3">
          <div className={`mt-0.5 h-8 w-1 flex-shrink-0 rounded-full ${getAccentClass(item)}`} />
          <div>
            <p className="text-sm font-medium text-ink">
              {item.provider} / {item.model}
            </p>
            <p className="mt-0.5 text-sm text-ink-secondary">{formatBreakdown(item)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
