import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/useReducedMotion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

function joinClasses(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function ScrollReveal({ children, className, delayMs = 0 }: ScrollRevealProps) {
  const reducedMotion = useReducedMotion();
  const elementRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(reducedMotion);

  useEffect(() => {
    if (revealed || reducedMotion) {
      setRevealed(true);
      return;
    }

    if (typeof window === "undefined" || typeof window.IntersectionObserver !== "function") {
      setRevealed(true);
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry || (!entry.isIntersecting && entry.intersectionRatio <= 0)) {
          return;
        }

        setRevealed(true);
        observer.unobserve(entry.target);
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [reducedMotion, revealed]);

  return (
    <div
      ref={elementRef}
      className={joinClasses("scroll-reveal", revealed && "scroll-reveal-visible", className)}
      style={{ "--scroll-reveal-delay": `${delayMs}ms` } as CSSProperties}
      data-revealed={revealed ? "true" : "false"}
    >
      {children}
    </div>
  );
}
