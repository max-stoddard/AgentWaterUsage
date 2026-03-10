import type { OverviewResponse } from "@agentic-insights/shared";

interface DataStatusPanelProps {
  diagnostics: OverviewResponse["diagnostics"];
}

function getSanitizedMessage(message: string | null): string | null {
  if (!message) {
    return null;
  }

  return message
    .replaceAll("Configured Codex home", "Configured data path")
    .replaceAll("No Codex usage files were found in this directory yet.", "No usage files were found in this directory yet.")
    .replaceAll("Codex data was found, but no token history could be parsed yet.", "Usage data was found, but no token history could be parsed yet.")
    .replaceAll("No local Codex history was found yet.", "No local usage history was found yet.")
    .replaceAll("Codex", "usage");
}

export function DataStatusPanel({ diagnostics }: DataStatusPanelProps) {
  const isNoData = diagnostics.state === "no_data";
  const title = isNoData ? "No local usage history detected" : "Could not read local usage data";
  const copy = isNoData
    ? "No readable local usage history was found at the current path yet. Run a supported coding agent locally, then refresh this dashboard."
    : "The dashboard could not read the current local usage path. Check the path, then refresh to load new activity.";
  const message = getSanitizedMessage(diagnostics.message);

  return (
    <section className="panel-shell px-6 py-6 sm:px-8 sm:py-8">
      <div className="max-w-3xl">
        <div className="micro-pill">{isNoData ? "Waiting for local history" : "Local read issue"}</div>
        <h2 className="mt-4 section-heading">{title}</h2>
        <p className="mt-4 text-base leading-7 text-stone-600">{copy}</p>
      </div>

      <div className="mt-6 panel-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Current data path</p>
        <code className="mt-3 block overflow-x-auto text-sm text-stone-800">{diagnostics.codexHome}</code>
      </div>

      {message ? (
        <div className="mt-4 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-6 text-stone-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
