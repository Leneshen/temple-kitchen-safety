import { ACTIONS, AREAS, CHECKS, FRIDGE_MAX_C, HAZARDS } from "./formOptions";
import {
  INCIDENT_VALUES,
  SEVERITY_VALUES,
  type IncidentType,
  type NewReport,
  type Severity,
} from "./types";

export const LIMITS = {
  nameLength: 100,
  descriptionLength: 1000,
  minTemp: -30,
  maxTemp: 30,
} as const;

/**
 * Follow-up rules, applied by both the form and the API so they can't drift apart:
 * a warm fridge or a high-severity incident always needs follow-up.
 */
export function needsFollowUp(
  report: Pick<NewReport, "followUpRequired" | "fridgeTempC" | "severity">,
): boolean {
  return (
    report.followUpRequired ||
    (report.fridgeTempC !== null && report.fridgeTempC > FRIDGE_MAX_C) ||
    report.severity === "high"
  );
}

export type ParseResult = { ok: true; report: NewReport } | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function stringList(
  value: unknown,
  allowed: readonly string[],
  field: string,
  errors: string[],
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    errors.push(`${field} must be a list of options.`);
    return [];
  }
  const unknown = value.filter((v) => !allowed.includes(v));
  if (unknown.length) errors.push(`${field} has unknown options: ${unknown.join(", ")}.`);
  return [...new Set(value)];
}

/**
 * Server-side check of a submitted report. Never trust the browser:
 * types, allowed options, lengths and the incident rules are all re-checked here.
 */
export function parseNewReport(input: unknown): ParseResult {
  if (!isObject(input)) return { ok: false, errors: ["Request body must be a JSON object."] };
  const errors: string[] = [];

  const submittedBy = typeof input.submittedBy === "string" ? input.submittedBy.trim() : "";
  if (!submittedBy) errors.push("submittedBy is required.");
  if (submittedBy.length > LIMITS.nameLength) errors.push("submittedBy is too long.");

  const areas = stringList(input.areas, AREAS, "areas", errors);
  if (areas.length === 0) errors.push("Select at least one area.");
  const checks = stringList(input.checks, CHECKS, "checks", errors);

  let fridgeTempC: number | null = null;
  if (input.fridgeTempC !== undefined && input.fridgeTempC !== null) {
    if (typeof input.fridgeTempC !== "number" || !Number.isFinite(input.fridgeTempC)) {
      errors.push("fridgeTempC must be a number.");
    } else if (input.fridgeTempC < LIMITS.minTemp || input.fridgeTempC > LIMITS.maxTemp) {
      errors.push("fridgeTempC is out of range.");
    } else {
      fridgeTempC = Math.round(input.fridgeTempC * 10) / 10;
    }
  }

  const incidentType = (input.incidentType ?? "none") as IncidentType;
  if (!INCIDENT_VALUES.includes(incidentType)) errors.push("incidentType is not valid.");
  const incident = incidentType !== "none";

  let hazards: string[] = [];
  let severity: Severity | null = null;
  let description = "";
  let actionsTaken: string[] = [];

  if (incident) {
    hazards = stringList(input.hazards, HAZARDS, "hazards", errors);
    actionsTaken = stringList(input.actionsTaken, ACTIONS, "actionsTaken", errors);
    if (actionsTaken.length === 0) errors.push("Select what was done about the incident.");

    if (SEVERITY_VALUES.includes(input.severity as Severity)) severity = input.severity as Severity;
    else errors.push("severity is required when something happened.");

    description = typeof input.description === "string" ? input.description.trim() : "";
    if (!description) errors.push("description is required when something happened.");
    if (description.length > LIMITS.descriptionLength) errors.push("description is too long.");
  }

  if (errors.length) return { ok: false, errors };

  const report: NewReport = {
    submittedBy,
    areas,
    checks,
    fridgeTempC,
    incidentType,
    hazards,
    severity,
    description,
    actionsTaken,
    followUpRequired: input.followUpRequired === true,
  };
  report.followUpRequired = needsFollowUp(report);
  return { ok: true, report };
}
