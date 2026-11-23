import { describe, expect, it } from "vitest";
import { needsFollowUp, parseNewReport } from "../shared/reportRules";

describe("parseNewReport", () => {
  it("clears incident details when nothing happened", () => {
    const result = parseNewReport({
      submittedBy: "  Anita ",
      areas: ["Floors", "Floors"],
      hazards: ["Chemical"],
      description: "left over",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.report.submittedBy).toBe("Anita");
    expect(result.report.areas).toEqual(["Floors"]);
    expect(result.report.hazards).toEqual([]);
    expect(result.report.description).toBe("");
  });

  it("rejects a body that is not an object", () => {
    expect(parseNewReport([1, 2]).ok).toBe(false);
    expect(parseNewReport(null).ok).toBe(false);
  });
});

describe("needsFollowUp", () => {
  const base = { followUpRequired: false, fridgeTempC: null, severity: null };
  it("flags warm fridges and high severity", () => {
    expect(needsFollowUp(base)).toBe(false);
    expect(needsFollowUp({ ...base, fridgeTempC: 5 })).toBe(false);
    expect(needsFollowUp({ ...base, fridgeTempC: 5.5 })).toBe(true);
    expect(needsFollowUp({ ...base, severity: "high" })).toBe(true);
  });
});
