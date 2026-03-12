import type { ReactNode } from "react";

interface AlertBannerProps {
  title: string;
  children: ReactNode;
}

export function AlertBanner({ title, children }: AlertBannerProps) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-rose-950"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-rose-900">{children}</p>
    </section>
  );
}
