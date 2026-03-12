interface SkeletonBlockProps {
  className: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={`animate-pulse rounded-lg border border-zinc-200 bg-white ${className}`} />;
}
