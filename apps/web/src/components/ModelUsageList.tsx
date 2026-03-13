import type { ModelUsageEntry } from "@agentic-insights/shared";
import { formatNumber } from "../lib/format";

interface ModelUsageListProps {
  items: ModelUsageEntry[];
}

function getAccentClass(item: ModelUsageEntry): string {
  if (item.supportedTokens > 0) {
    return "bg-emerald-500";
  }

  if (item.excludedTokens > 0) {
    return "bg-accent";
  }

  return "bg-ink-tertiary";
}

function formatBreakdown(item: ModelUsageEntry): string {
  const parts = [`${formatNumber(item.totalTokens)} tokens`];

  if (item.supportedTokens > 0) {
    parts.push(`${formatNumber(item.supportedTokens)} estimated`);
  }

  if (item.excludedTokens > 0) {
    parts.push(`${formatNumber(item.excludedTokens)} excluded`);
  }

  if (item.unestimatedTokens > 0) {
    parts.push(`${formatNumber(item.unestimatedTokens)} token-only`);
  }

  return parts.join(" · ");
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
