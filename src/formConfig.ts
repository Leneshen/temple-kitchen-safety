import type { IncidentType, Severity } from "./types";

// Option lists live in shared/formOptions.ts so the API validates against the same values.
export { ACTIONS, AREAS, CHECKS, FRIDGE_MAX_C, HAZARDS } from "../shared/formOptions";

export const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "none", label: "Nothing to report" },
  { value: "hazard", label: "Hazard found" },
  { value: "near_miss", label: "Near miss" },
  { value: "spill", label: "Spill" },
  { value: "equipment_fault", label: "Equipment fault" },
  { value: "injury", label: "Injury" },
];

export const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function incidentLabel(value: IncidentType): string {
  return INCIDENT_TYPES.find((t) => t.value === value)?.label ?? value;
}
