import type { NewReport, Report, ReportStatus } from "../shared/types";

/** The subset of the D1 API we use, so tests can run against a local SQLite database. */
export interface Db {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta: { changes: number } }>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      first<T = unknown>(): Promise<T | null>;
    };
  };
}

const TABLE = "kitchen_safety_reports";
const MAX_ROWS = 500;

export interface ReportRow {
  id: string;
  created_at: string;
  submitted_by: string;
  areas: string;
  checks: string;
  fridge_temp_c: number | null;
  incident_type: Report["incidentType"];
  hazards: string;
  severity: Report["severity"];
  description: string;
  actions_taken: string;
  follow_up_required: number;
  status: ReportStatus;
}

const list = (json: string): string[] => {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
};

export const rowToReport = (r: ReportRow): Report => ({
  id: r.id,
  createdAt: r.created_at,
  submittedBy: r.submitted_by,
  areas: list(r.areas),
  checks: list(r.checks),
  fridgeTempC: r.fridge_temp_c,
  incidentType: r.incident_type,
  hazards: list(r.hazards),
  severity: r.severity,
  description: r.description,
  actionsTaken: list(r.actions_taken),
  followUpRequired: r.follow_up_required === 1,
  status: r.status,
});

export async function listReports(db: Db): Promise<Report[]> {
  const { results } = await db
    .prepare(`SELECT * FROM ${TABLE} ORDER BY created_at DESC, rowid DESC LIMIT ?`)
    .bind(MAX_ROWS)
    .all<ReportRow>();
  return results.map(rowToReport);
}

export async function insertReport(
  db: Db,
  report: NewReport,
  id: string = crypto.randomUUID(),
  createdAt: string = new Date().toISOString(),
): Promise<Report> {
  await db
    .prepare(
      `INSERT INTO ${TABLE} (id, created_at, submitted_by, areas, checks, fridge_temp_c,
         incident_type, hazards, severity, description, actions_taken, follow_up_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      createdAt,
      report.submittedBy,
      JSON.stringify(report.areas),
      JSON.stringify(report.checks),
      report.fridgeTempC,
      report.incidentType,
      JSON.stringify(report.hazards),
      report.severity,
      report.description,
      JSON.stringify(report.actionsTaken),
      report.followUpRequired ? 1 : 0,
    )
    .run();
  return { ...report, id, createdAt, status: "open" };
}

/** Returns false when no report has that id. */
export async function setReportStatus(db: Db, id: string, status: ReportStatus): Promise<boolean> {
  const { meta } = await db
    .prepare(`UPDATE ${TABLE} SET status = ?, resolved_at = ? WHERE id = ?`)
    .bind(status, status === "resolved" ? new Date().toISOString() : null, id)
    .run();
  return meta.changes > 0;
}
