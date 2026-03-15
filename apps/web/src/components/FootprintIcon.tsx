import type { ComponentProps } from "react";
import type { ImpactMetric } from "../lib/footprint";

interface FootprintIconProps extends ComponentProps<"svg"> {
  property: ImpactMetric;
}

export function FootprintIcon({ property, className, ...props }: FootprintIconProps) {
  if (property === "water") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" {...props}>
        <path
          fillRule="evenodd"
          d="M10 1.75a.75.75 0 0 1 .57.263c.8.932 2.127 2.57 3.332 4.4 1.198 1.82 2.348 3.915 2.348 5.587A6.25 6.25 0 1 1 3.75 12c0-1.672 1.15-3.767 2.348-5.587 1.205-1.83 2.532-3.468 3.332-4.4A.75.75 0 0 1 10 1.75Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (property === "energy") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" {...props}>
        <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d="M5 15.5a3.5 3.5 0 1 1 .777-6.913A4.751 4.751 0 0 1 14.856 7.1 3.251 3.251 0 1 1 15 15.5H5Z" />
    </svg>
  );
}
