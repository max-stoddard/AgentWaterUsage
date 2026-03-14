import type { HTMLAttributes } from "react";

interface SkeletonBlockProps extends HTMLAttributes<HTMLDivElement> {
  className: string;
  tone?: "default" | "inverse";
}

export function SkeletonBlock({ className, tone = "default", ...props }: SkeletonBlockProps) {
  const toneClassName = tone === "inverse" ? "skeleton-shimmer-inverse" : undefined;
  return <div className={["skeleton-shimmer", toneClassName, className].filter(Boolean).join(" ")} {...props} />;
}
