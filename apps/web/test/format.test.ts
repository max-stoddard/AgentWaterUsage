import { describe, expect, it } from "vitest";
import { formatCompactNumber } from "../src/lib/format";

describe("formatCompactNumber", () => {
  it("formats small values without suffixes", () => {
    expect(formatCompactNumber(1)).toBe("1");
    expect(formatCompactNumber(12)).toBe("12");
    expect(formatCompactNumber(123)).toBe("123");
  });

  it("formats larger values with compact suffixes and roughly three significant figures", () => {
    expect(formatCompactNumber(1234)).toBe("1.23K");
    expect(formatCompactNumber(12_345)).toBe("12.3K");
    expect(formatCompactNumber(1_234_567)).toBe("1.23M");
  });
});
