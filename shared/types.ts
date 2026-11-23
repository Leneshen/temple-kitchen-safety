export type IncidentType =
  | "none"
  | "hazard"
  | "near_miss"
  | "injury"
  | "equipment_fault"
  | "spill";

export type Severity = "low" | "medium" | "high";

export type ReportStatus = "open" | "resolved";

/** What a volunteer fills in on the form. */
export interface ReportDraft {
  submittedBy: string;
  areas: string[];
  checks: string[];
  fridgeTempC: string; // kept as text while typing; parsed on submit
  incidentType: IncidentType;
  hazards: string[];
  severity: Severity | "";
  description: string;
  actionsTaken: string[];
  followUpRequired: boolean;
  confirmed: boolean;
}

/** A saved report, as stored locally or in Supabase. */
export interface Report {
  id: string;
  createdAt: string; // ISO timestamp
  submittedBy: string;
  areas: string[];
  checks: string[];
  fridgeTempC: number | null;
  incidentType: IncidentType;
  hazards: string[];
  severity: Severity | null;
  description: string;
  actionsTaken: string[];
  followUpRequired: boolean;
  status: ReportStatus;
}

export type NewReport = Omit<Report, "id" | "createdAt" | "status">;

export const INCIDENT_VALUES: readonly IncidentType[] = [
  "none",
  "hazard",
  "near_miss",
  "injury",
  "equipment_fault",
  "spill",
];

export const SEVERITY_VALUES: readonly Severity[] = ["low", "medium", "high"];

