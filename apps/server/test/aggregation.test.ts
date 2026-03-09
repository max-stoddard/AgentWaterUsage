import { describe, expect, it } from "vitest";
import { aggregateTimeseries } from "../src/aggregation.js";
import type { ClassifiedUsageEvent } from "../src/types.js";

function supportedEvent(id: string, ts: string, waterCentral: number): ClassifiedUsageEvent {
  return {
    id,
    sessionId: id,
    ts: Date.parse(ts),
    provider: "openai",
    model: "gpt-5.3-codex",
    source: "vscode",
    totalTokens: 100,
    inputTokens: 80,
    outputTokens: 20,
    cachedInputTokens: 10,
    splitSource: "last_usage",
    transport: "session",
    classification: "supported",
    eventCostUsd: 1,
    exclusionReason: null,
    waterLitres: {
      low: waterCentral / 2,
      central: waterCentral,
      high: waterCentral * 2
    }
  };
}

describe("aggregateTimeseries", () => {
  it("reconciles day, week, and month totals", () => {
    const events = [
      supportedEvent("a", "2026-03-03T12:00:00.000Z", 1),
      supportedEvent("b", "2026-03-04T12:00:00.000Z", 2),
      supportedEvent("c", "2026-03-15T12:00:00.000Z", 3)
    ];

    const day = aggregateTimeseries(events, "day", "UTC");
    const week = aggregateTimeseries(events, "week", "UTC");
    const month = aggregateTimeseries(events, "month", "UTC");

    const sum = (points: typeof day) => points.reduce((total, point) => total + point.waterLitres.central, 0);
    expect(sum(day)).toBeCloseTo(sum(week), 6);
    expect(sum(day)).toBeCloseTo(sum(month), 6);
    expect(week[0]?.label).toMatch(/^Week of /);
  });

  it("uses timezone-aware bucket labels", () => {
    const points = aggregateTimeseries([supportedEvent("a", "2026-03-09T00:30:00.000Z", 1)], "day", "America/Los_Angeles");
    expect(points[0]?.key).toBe("2026-03-08");
  });
});
