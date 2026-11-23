import { FRIDGE_MAX_C } from "../formConfig";
import { LIMITS, needsFollowUp } from "../../shared/reportRules";
import type { NewReport, ReportDraft } from "../types";

export type Errors = Partial<Record<keyof ReportDraft, string>>;

export const emptyDraft = (): ReportDraft => ({
  submittedBy: "",
  areas: [],
  checks: [],
  fridgeTempC: "",
  incidentType: "none",
  hazards: [],
  severity: "",
  description: "",
  actionsTaken: [],
  followUpRequired: false,
  confirmed: false,
});

export function hasIncident(draft: Pick<ReportDraft, "incidentType">): boolean {
  return draft.incidentType !== "none";
}

export function parseTemp(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : NaN;
}

/** Returns a message per invalid field; an empty object means the draft is valid. */
export function validate(draft: ReportDraft): Errors {
  const errors: Errors = {};

  if (!draft.submittedBy.trim()) errors.submittedBy = "Please enter your name.";
  else if (draft.submittedBy.trim().length > LIMITS.nameLength) {
    errors.submittedBy = "That name is too long.";
  }
  if (draft.areas.length === 0) errors.areas = "Select at least one area you cleaned.";

  const temp = parseTemp(draft.fridgeTempC);
  if (Number.isNaN(temp)) {
    errors.fridgeTempC = "Enter the temperature as a number, e.g. 4.";
  } else if (temp !== null && (temp < LIMITS.minTemp || temp > LIMITS.maxTemp)) {
    errors.fridgeTempC = "That temperature looks wrong. Please check the reading.";
  }

  if (hasIncident(draft)) {
    if (!draft.severity) errors.severity = "Choose how serious it was.";
    if (!draft.description.trim()) errors.description = "Briefly describe what happened.";
    else if (draft.description.trim().length > LIMITS.descriptionLength) {
      errors.description = "Please keep the description under 1,000 characters.";
    }
    if (draft.actionsTaken.length === 0) {
      errors.actionsTaken = "Select what was done about it.";
    }
  }

  if (!draft.confirmed) errors.confirmed = "Please confirm before submitting.";
  return errors;
}

/** Fridge reading above the safe limit always needs follow-up. */
export function fridgeOutOfRange(draft: Pick<ReportDraft, "fridgeTempC">): boolean {
  const temp = parseTemp(draft.fridgeTempC);
  return temp !== null && !Number.isNaN(temp) && temp > FRIDGE_MAX_C;
}

/** Converts a valid draft into the record we save. Incident fields are cleared when nothing happened. */
export function toNewReport(draft: ReportDraft): NewReport {
  const incident = hasIncident(draft);
  const report: NewReport = {
    submittedBy: draft.submittedBy.trim(),
    areas: draft.areas,
    checks: draft.checks,
    fridgeTempC: parseTemp(draft.fridgeTempC),
    incidentType: draft.incidentType,
    hazards: incident ? draft.hazards : [],
    severity: incident && draft.severity ? draft.severity : null,
    description: incident ? draft.description.trim() : "",
    actionsTaken: incident ? draft.actionsTaken : [],
    followUpRequired: draft.followUpRequired,
  };
  report.followUpRequired = needsFollowUp(report);
  return report;
}
