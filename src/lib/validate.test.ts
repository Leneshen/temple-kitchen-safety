import { describe, expect, it } from "vitest";
import { emptyDraft, fridgeOutOfRange, toNewReport, validate } from "./validate";
import type { ReportDraft } from "../types";

const valid = (over: Partial<ReportDraft> = {}): ReportDraft => ({
  ...emptyDraft(),
  submittedBy: "Priya",
  areas: ["Floors"],
  confirmed: true,
  ...over,
});

describe("validate", () => {
  it("accepts a routine clean with nothing to report", () => {
    expect(validate(valid())).toEqual({});
  });

  it("requires name, an area and sign-off", () => {
    const errors = validate(emptyDraft());
    expect(Object.keys(errors).sort()).toEqual(["areas", "confirmed", "submittedBy"]);
  });

  it("requires severity, description and actions when something happened", () => {
    const errors = validate(valid({ incidentType: "spill" }));
    expect(errors).toHaveProperty("severity");
    expect(errors).toHaveProperty("description");
    expect(errors).toHaveProperty("actionsTaken");
  });

  it("rejects non-numeric and implausible fridge readings", () => {
    expect(validate(valid({ fridgeTempC: "cold" }))).toHaveProperty("fridgeTempC");
    expect(validate(valid({ fridgeTempC: "75" }))).toHaveProperty("fridgeTempC");
    expect(validate(valid({ fridgeTempC: "3.5" }))).toEqual({});
  });
});

describe("toNewReport", () => {
  it("flags a warm fridge for follow-up", () => {
    expect(fridgeOutOfRange({ fridgeTempC: "8" })).toBe(true);
    expect(toNewReport(valid({ fridgeTempC: "8" })).followUpRequired).toBe(true);
  });

  it("always flags high-severity incidents", () => {
    const report = toNewReport(
      valid({
        incidentType: "injury",
        severity: "high",
        description: "Burn from oil",
        actionsTaken: ["First aid given"],
      }),
    );
    expect(report.followUpRequired).toBe(true);
  });

  it("drops incident details when nothing happened", () => {
    const report = toNewReport(valid({ hazards: ["Chemical"], description: "left over" }));
    expect(report.hazards).toEqual([]);
    expect(report.description).toBe("");
    expect(report.severity).toBeNull();
  });
});
