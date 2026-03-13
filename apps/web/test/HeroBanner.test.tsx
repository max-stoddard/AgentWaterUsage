import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroBanner } from "../src/components/HeroBanner";
import { FOOTPRINT_TEXT_CLASS_BY_PROPERTY } from "../src/lib/footprint";

describe("HeroBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the semantic footprint colors as the headline rotates", () => {
    const { container } = render(<HeroBanner />);

    const getAnimatedWord = () => container.querySelector(".hero-word");
    expect(getAnimatedWord()).toHaveTextContent("tokens");
    expect(getAnimatedWord()).toHaveClass(FOOTPRINT_TEXT_CLASS_BY_PROPERTY.token);

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(getAnimatedWord()).toHaveTextContent("water");
    expect(getAnimatedWord()).toHaveClass(FOOTPRINT_TEXT_CLASS_BY_PROPERTY.water);

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(getAnimatedWord()).toHaveTextContent("energy");
    expect(getAnimatedWord()).toHaveClass(FOOTPRINT_TEXT_CLASS_BY_PROPERTY.energy);

    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(getAnimatedWord()).toHaveTextContent("carbon");
    expect(getAnimatedWord()).toHaveClass(FOOTPRINT_TEXT_CLASS_BY_PROPERTY.carbon);

    expect(screen.getByText(/understand your agent/i)).toBeInTheDocument();
    expect(screen.getByText(/footprint locally\./i)).toBeInTheDocument();
  });
});
