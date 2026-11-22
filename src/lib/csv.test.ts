import { describe, expect, it } from "vitest";
import { csvCell, reportsToCsv } from "./csv";
import type { Report } from "../types";

describe("csv", () => {
  it("quotes cells containing commas, quotes or line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("writes a header and one row per report", () => {
    const report: Report = {
      id: "1",
      createdAt: "2026-11-22T00:00:00.000Z",
      submittedBy: "Raj",
      areas: ["Floors", "Ovens"],
      checks: [],
      fridgeTempC: 4,
      incidentType: "none",
      hazards: [],
      severity: null,
      description: "",
      actionsTaken: [],
      followUpRequired: false,
      status: "open",
    };
    const lines = reportsToCsv([report]).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Areas cleaned");
    expect(lines[1]).toContain("Floors; Ovens");
  });
});
