import type { IncidentType, Severity } from "./types";

// Edit these lists to match the temple's own kitchen procedures.

export const AREAS = [
  "Benches and prep surfaces",
  "Stovetops and burners",
  "Ovens",
  "Sinks and dishwasher",
  "Fridges and cool room",
  "Floors",
  "Dry storage",
  "Exhaust hood",
  "Bins and waste area",
];

export const CHECKS = [
  "Gloves worn",
  "Apron worn",
  "Chemicals used as per label",
  "Chemicals stored away after use",
  "Raw and cooked food kept separate",
  "Food covered and labelled",
  "Fridge temperature checked",
  "Hand-wash station stocked",
  "Rubbish and waste disposed of",
  "Gas and appliances switched off",
];

export const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "none", label: "Nothing to report" },
  { value: "hazard", label: "Hazard found" },
  { value: "near_miss", label: "Near miss" },
  { value: "spill", label: "Spill" },
  { value: "equipment_fault", label: "Equipment fault" },
  { value: "injury", label: "Injury" },
];

export const HAZARDS = [
  "Wet or slippery floor",
  "Sharp object",
  "Hot surface or oil",
  "Chemical",
  "Electrical",
  "Gas smell",
  "Pests",
  "Damaged equipment",
  "Blocked exit",
];

export const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const ACTIONS = [
  "Cleaned up",
  "Area cordoned off",
  "Equipment tagged out",
  "First aid given",
  "Reported to committee",
  "Reported to kitchen coordinator",
];

/** Safe range for chilled storage, in °C. */
export const FRIDGE_MAX_C = 5;

export function incidentLabel(value: IncidentType): string {
  return INCIDENT_TYPES.find((t) => t.value === value)?.label ?? value;
}
