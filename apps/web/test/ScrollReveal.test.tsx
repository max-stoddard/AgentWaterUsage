import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "../src/components/ScrollReveal";

describe("ScrollReveal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reveals content after it enters the viewport", async () => {
    let observedElement: Element | null = null;
    let observerCallback: IntersectionObserverCallback | null = null;
    const unobserve = vi.fn();
    const disconnect = vi.fn();

    const intersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
      observerCallback = callback;

      return {
        observe(element: Element) {
          observedElement = element;
        },
        unobserve,
        disconnect
      };
    });

    vi.stubGlobal("IntersectionObserver", intersectionObserver);

    render(
      <ScrollReveal>
        <section>Usage card</section>
      </ScrollReveal>
    );

    const wrapper = screen.getByText("Usage card").closest("[data-revealed]");
    expect(wrapper).toHaveAttribute("data-revealed", "false");
    expect(intersectionObserver).toHaveBeenCalledTimes(1);
    expect(observedElement).toBe(wrapper);

    act(() => {
      observerCallback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
            target: wrapper as Element
          } as IntersectionObserverEntry
        ],
        {} as IntersectionObserver
      );
    });

    await waitFor(() => {
      expect(wrapper).toHaveAttribute("data-revealed", "true");
    });
    expect(unobserve).toHaveBeenCalledWith(wrapper);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("shows content immediately when reduced motion is enabled", () => {
    const originalMatchMedia = window.matchMedia;
    const intersectionObserver = vi.fn();

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
      media: "(prefers-reduced-motion: reduce)",
      onchange: null
    })) as typeof window.matchMedia;

    vi.stubGlobal("IntersectionObserver", intersectionObserver);

    render(
      <ScrollReveal>
        <section>Coverage card</section>
      </ScrollReveal>
    );

    const wrapper = screen.getByText("Coverage card").closest("[data-revealed]");
    expect(wrapper).toHaveAttribute("data-revealed", "true");
    expect(intersectionObserver).not.toHaveBeenCalled();

    window.matchMedia = originalMatchMedia;
  });
});
