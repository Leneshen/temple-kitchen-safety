import type { NewReport, Report, ReportStatus } from "../types";

export interface ReportStore {
  /** "api" when saving to the shared D1 database, "demo" when saving in this browser only. */
  readonly mode: "api" | "demo";
  list(): Promise<Report[]>;
  add(report: NewReport): Promise<Report>;
  setStatus(id: string, status: ReportStatus): Promise<void>;
}

/** Thrown when a coordinator needs to sign in (Cloudflare Access). */
export class SignInRequiredError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
  });
  // Access may redirect an expired session to its login page instead of returning JSON.
  if (res.status === 401 || res.status === 403 || res.redirected) {
    throw new SignInRequiredError("Please sign in as a kitchen coordinator.");
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string; details?: string[] } & T;
  if (!res.ok) {
    const details = body.details?.length ? ` ${body.details.join(" ")}` : "";
    throw new Error((body.error ?? `Request failed (${res.status}).`) + details);
  }
  return body;
}

/** Talks to the Cloudflare Pages Functions in /functions, which store reports in D1. */
export class ApiStore implements ReportStore {
  readonly mode = "api" as const;

  async list(): Promise<Report[]> {
    return (await request<{ reports: Report[] }>("/api/reports")).reports;
  }

  async add(report: NewReport): Promise<Report> {
    const body = JSON.stringify(report);
    return (await request<{ report: Report }>("/api/submit", { method: "POST", body })).report;
  }

  async setStatus(id: string, status: ReportStatus): Promise<void> {
    await request(`/api/reports/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

const LOCAL_KEY = "kitchen-safety-reports";

/** Used when no API is configured, e.g. `npm run dev`. Reports stay in this browser. */
export class LocalStore implements ReportStore {
  readonly mode = "demo" as const;
  private memory: Report[] | null = null;

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
  return import.meta.env.VITE_STORAGE === "api" ? new ApiStore() : new LocalStore();
}
