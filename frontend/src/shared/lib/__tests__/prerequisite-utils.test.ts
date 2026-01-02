import { describe, expect, it } from "vitest";
import { isModuleCode, parsePrerequisites } from "@/shared/lib/prerequisite-utils";

describe("prerequisite-utils", () => {
  it("validates module codes", () => {
    expect(isModuleCode("CS1010")).toBe(true);
    expect(isModuleCode("Math 101")).toBe(false);
  });

  it("parses prerequisite strings into module codes", () => {
    const result = parsePrerequisites("CS1010 or CS1101S and MA1521");
    expect(result).toEqual(["CS1010", "CS1101S", "MA1521"]);
  });
});
