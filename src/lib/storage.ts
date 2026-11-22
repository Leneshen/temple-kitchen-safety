import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NewReport, Report, ReportStatus } from "../types";

export interface ReportStore {
  /** "supabase" when connected to the shared database, "demo" when saving in this browser only. */
  readonly mode: "supabase" | "demo";
  list(): Promise<Report[]>;
  add(report: NewReport): Promise<Report>;
  setStatus(id: string, status: ReportStatus): Promise<void>;
}

const TABLE = "kitchen_safety_reports";

/** Row shape in Postgres (snake_case). */
interface ReportRow {
  id: string;
  created_at: string;
  submitted_by: string;
  areas: string[];
  checks: string[];
  fridge_temp_c: number | null;
  incident_type: Report["incidentType"];
  hazards: string[];
  severity: Report["severity"];
  description: string;
  actions_taken: string[];
  follow_up_required: boolean;
  status: ReportStatus;
}

export const fromRow = (r: ReportRow): Report => ({
  id: r.id,
  createdAt: r.created_at,
  submittedBy: r.submitted_by,
  areas: r.areas ?? [],
  checks: r.checks ?? [],
  fridgeTempC: r.fridge_temp_c,
  incidentType: r.incident_type,
  hazards: r.hazards ?? [],
  severity: r.severity,
  description: r.description ?? "",
  actionsTaken: r.actions_taken ?? [],
  followUpRequired: r.follow_up_required,
  status: r.status,
});

export const toRow = (r: NewReport) => ({
  submitted_by: r.submittedBy,
  areas: r.areas,
  checks: r.checks,
  fridge_temp_c: r.fridgeTempC,
  incident_type: r.incidentType,
  hazards: r.hazards,
  severity: r.severity,
  description: r.description,
  actions_taken: r.actionsTaken,
  follow_up_required: r.followUpRequired,
});

class SupabaseStore implements ReportStore {
  readonly mode = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  async list(): Promise<Report[]> {
    const { data, error } = await this.db
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ReportRow[]).map(fromRow);
  }

  async add(report: NewReport): Promise<Report> {
    const { data, error } = await this.db.from(TABLE).insert(toRow(report)).select().single();
    if (error) throw new Error(error.message);
    return fromRow(data as ReportRow);
  }

  async setStatus(id: string, status: ReportStatus): Promise<void> {
    const { error } = await this.db.from(TABLE).update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  }
}

const LOCAL_KEY = "kitchen-safety-reports";

/** Fallback used when no Supabase keys are configured, e.g. the public GitHub Pages demo. */
export class LocalStore implements ReportStore {
  readonly mode = "demo" as const;
  constructor(private storage: Pick<Storage, "getItem" | "setItem"> | null = safeLocalStorage()) {}

  private read(): Report[] {
    try {
      const raw = this.storage?.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as Report[]) : [];
    } catch {
      return [];
    }
  }

  private write(reports: Report[]): void {
    try {
      this.storage?.setItem(LOCAL_KEY, JSON.stringify(reports));
    } catch {
      // Storage can be unavailable (private mode); the report still shows for this session.
    }
  }

  private memory: Report[] | null = null;

  async list(): Promise<Report[]> {
    this.memory ??= this.read();
    return [...this.memory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async add(report: NewReport): Promise<Report> {
    const saved: Report = {
      ...report,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "open",
    };
    this.memory = [saved, ...(await this.list())];
    this.write(this.memory);
    return saved;
  }

  async setStatus(id: string, status: ReportStatus): Promise<void> {
    this.memory = (await this.list()).map((r) => (r.id === id ? { ...r, status } : r));
    this.write(this.memory);
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createStore(): ReportStore {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && key ? new SupabaseStore(createClient(url, key)) : new LocalStore();
}
