import type { ReactNode } from "react";

interface MetricCardProps {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  footer?: ReactNode;
  tone?: "default" | "feature";
  size?: "default" | "compact";
  className?: string;
}

function joinClasses(...values: Array<string | undefined | false>): string {
  return values.filter(Boolean).join(" ");
}

export function MetricCard({
  eyebrow,
  title,
  value,
  detail,
  footer,
  tone = "default",
  size = "default",
  className
}: MetricCardProps) {
  const featured = tone === "feature";
  const compact = size === "compact";

  return (
    <article
      className={joinClasses(
        "flex h-full flex-col rounded-lg border px-5 py-5 sm:px-6 sm:py-6",
        featured
          ? "border-zinc-800 bg-zinc-900 text-zinc-50"
          : "border-zinc-200 bg-white text-zinc-900",
        className
      )}
    >
      <div>
        <p
          className={joinClasses(
            "text-[0.68rem] font-semibold uppercase tracking-[0.22em]",
            featured ? "text-cyan-200" : "text-zinc-500"
          )}
        >
          {eyebrow}
        </p>
        <p className={joinClasses("mt-3 text-base font-medium", featured ? "text-zinc-300" : "text-zinc-700")}>
          {title}
        </p>
      </div>

      <p
        className={joinClasses(
          "mt-8 font-semibold tracking-[-0.06em]",
          featured
            ? "text-4xl text-white sm:text-5xl"
            : compact
              ? "text-[1.9rem] text-zinc-900"
              : "text-[2.2rem] text-zinc-900 sm:text-4xl"
        )}
      >
        {value}
      </p>
      <p className={joinClasses("mt-4 text-sm leading-6", featured ? "text-zinc-300" : "text-zinc-600")}>{detail}</p>

      {footer ? (
        <div
          className={joinClasses(
            "mt-auto pt-6 text-sm",
            featured ? "border-t border-white/10 text-zinc-400" : "border-t border-zinc-200 text-zinc-600"
          )}
        >
          {footer}
        </div>
      ) : null}
    </article>
  );
}
