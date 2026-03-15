import type { ReactNode } from "react";

interface MetricCardProps {
  eyebrow: string;
  title?: string;
  value: ReactNode;
  detail?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  tone?: "default" | "water" | "energy" | "carbon";
  className?: string;
  eyebrowClassName?: string;
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
  aside,
  tone = "default",
  className,
  eyebrowClassName
}: MetricCardProps) {
  const toneClasses =
    tone === "water"
      ? {
          card: "bg-[linear-gradient(135deg,rgba(2,132,199,1),rgba(15,23,42,0.96))] text-white shadow-lg",
          eyebrow: "text-sky-200",
          title: "text-slate-200",
          value: "text-4xl text-white sm:text-5xl lg:text-6xl",
          detail: "text-slate-200",
          footer: "border-t border-white/10 text-slate-300"
        }
      : tone === "energy"
        ? {
            card: "bg-[linear-gradient(135deg,rgba(254,243,199,1),rgba(245,158,11,0.28))] text-slate-950 shadow-lg shadow-amber-950/5 ring-1 ring-amber-200/80",
            eyebrow: "text-amber-900/80",
            title: "text-amber-950/70",
            value: "text-3xl text-slate-950 sm:text-4xl lg:text-5xl",
            detail: "text-amber-950/75",
            footer: "border-t border-amber-950/10 text-amber-950/70"
          }
        : tone === "carbon"
          ? {
              card: "bg-[linear-gradient(135deg,rgba(241,245,249,1),rgba(71,85,105,0.22))] text-slate-950 shadow-lg shadow-slate-950/5 ring-1 ring-slate-300/80",
              eyebrow: "text-slate-700",
              title: "text-slate-700/80",
              value: "text-3xl text-slate-950 sm:text-4xl lg:text-5xl",
              detail: "text-slate-700/80",
              footer: "border-t border-slate-900/10 text-slate-700/80"
            }
        : {
            card: "card",
            eyebrow: "text-ink-secondary",
            title: "text-ink-secondary",
            value: "text-3xl text-ink sm:text-4xl",
            detail: "text-ink-secondary",
            footer: "border-t border-slate-200/60 text-ink-secondary"
          };

  return (
    <article
      className={joinClasses(
        "flex flex-col rounded-xl p-6 sm:p-8",
        toneClasses.card,
        className
      )}
    >
      <div className={joinClasses("flex flex-col gap-6", aside ? "lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8" : "")}>
        <div className="min-w-0">
          <p
            className={joinClasses(
              "text-sm font-medium",
              toneClasses.eyebrow,
              eyebrowClassName
            )}
          >
            {eyebrow}
          </p>
          {title ? <p className={joinClasses("mt-1.5 text-sm", toneClasses.title)}>{title}</p> : null}

          <div
            className={joinClasses(
              title ? "mt-6 font-bold tracking-[-0.04em]" : "mt-4 font-bold tracking-[-0.04em]",
              toneClasses.value
            )}
          >
            {value}
          </div>
          {detail ? <div className={joinClasses("mt-3 text-[15px] leading-relaxed", toneClasses.detail)}>{detail}</div> : null}
        </div>

        {aside ? <div className="min-w-0 lg:justify-self-end">{aside}</div> : null}
      </div>

      {footer ? (
        <div
          className={joinClasses(
            "mt-auto pt-5 text-sm",
            toneClasses.footer
          )}
        >
          {footer}
        </div>
      ) : null}
    </article>
  );
}
