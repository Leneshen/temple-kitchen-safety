import { incidentLabel } from "../formConfig";
import type { Report } from "../types";

const HEADERS = [
  "Submitted",
  "Name",
  "Areas cleaned",
  "Checks completed",
  "Fridge temp (°C)",
  "What happened",
  "Hazards",
  "Severity",
  "Description",
  "Actions taken",
  "Follow-up needed",
  "Status",
];

/** Quotes a value so commas, quotes and line breaks survive in Excel. */
export function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function reportsToCsv(reports: Report[]): string {
  const rows = reports.map((r) => [
    new Date(r.createdAt).toLocaleString("en-NZ"),
    r.submittedBy,
    r.areas.join("; "),
    r.checks.join("; "),
    r.fridgeTempC === null ? "" : String(r.fridgeTempC),
    incidentLabel(r.incidentType),
    r.hazards.join("; "),
    r.severity ?? "",
    r.description,
    r.actionsTaken.join("; "),
    r.followUpRequired ? "Yes" : "No",
    r.status,
  ]);
  return [HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
