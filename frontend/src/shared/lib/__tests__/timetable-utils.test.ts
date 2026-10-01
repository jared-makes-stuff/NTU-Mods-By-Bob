import { describe, expect, it } from "vitest";
import { calculateSpan, checkTimeOverlap, parseTime, parseWeeks } from "@/shared/lib/timetable-utils";

describe("timetable-utils", () => {
  it("parses time strings into minutes", () => {
    expect(parseTime("0900")).toBe(540);
    expect(parseTime("9:30")).toBe(570);
  });

  it("calculates slot span by duration", () => {
    expect(calculateSpan("0900", "1100")).toBe(4);
    expect(calculateSpan("1400", "1500")).toBe(2);
  });

  it("checks time overlap correctly", () => {
    expect(checkTimeOverlap("0900", "1100", "1000", "1200")).toBe(true);
    expect(checkTimeOverlap("0900", "1000", "1000", "1100")).toBe(false);
  });

  it("parses week ranges into sorted arrays", () => {
    expect(parseWeeks("Wk1-3,5")).toEqual([1, 2, 3, 5]);
    expect(parseWeeks("")).toHaveLength(13);
  });
});
