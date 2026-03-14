import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IndexingStatusCard } from "../src/components/IndexingStatusCard";

function createIndexing(phase: "discovering" | "parsing" | "estimating" | "finalizing") {
  return {
    phase,
    startedAt: Date.parse("2026-03-13T12:00:00.000Z"),
    updatedAt: Date.parse("2026-03-13T12:00:01.000Z")
  };
}

describe("IndexingStatusCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("renders the active indexing phase in a standalone card", () => {
    render(<IndexingStatusCard indexing={createIndexing("discovering")} />);

    expect(screen.getByTestId("indexing-status-card")).toBeInTheDocument();
    expect(screen.getByText("Scanning local usage files")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Scanning local usage files" })).toBeInTheDocument();
  });

  it("animates out before unmounting when indexing completes", () => {
    const { rerender } = render(<IndexingStatusCard indexing={createIndexing("finalizing")} />);

    rerender(<IndexingStatusCard indexing={null} />);

    expect(screen.getByTestId("indexing-status-shell")).toHaveClass("indexing-status-shell-closing");
    expect(screen.getByText("Preparing your dashboard")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(screen.queryByTestId("indexing-status-card")).not.toBeInTheDocument();
  });

  it("removes immediately when reduced motion is preferred", () => {
    const originalMatchMedia = window.matchMedia;
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

    const { rerender } = render(<IndexingStatusCard indexing={createIndexing("parsing")} />);
    rerender(<IndexingStatusCard indexing={null} />);

    expect(screen.queryByTestId("indexing-status-card")).not.toBeInTheDocument();

    window.matchMedia = originalMatchMedia;
  });
});
