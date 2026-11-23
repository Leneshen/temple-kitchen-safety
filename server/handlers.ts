import { parseNewReport } from "../shared/reportRules";
import { requireCoordinator, type AccessEnv } from "./access";
import { insertReport, listReports, setReportStatus, type Db } from "./db";
import { errorResponse, json, readJson } from "./http";

export interface Env extends AccessEnv {
  DB: Db;
}

/** POST /api/submit — public: volunteers submit a check without signing in. */
export async function submitReport(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = parseNewReport(body.body);
  if (!parsed.ok) return errorResponse(400, "Please check the form and try again.", parsed.errors);

  const report = await insertReport(env.DB, parsed.report);
  return json({ report }, 201);
}

/** GET /api/reports — coordinators only. */
export async function getReports(request: Request, env: Env): Promise<Response> {
  const denied = await requireCoordinator(request, env);
  if (denied) return denied;
  return json({ reports: await listReports(env.DB) });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PATCH /api/reports/:id — coordinators only; body { "status": "open" | "resolved" }. */
export async function updateReportStatus(request: Request, env: Env, id: string): Promise<Response> {
  const denied = await requireCoordinator(request, env);
  if (denied) return denied;
  if (!UUID.test(id)) return errorResponse(404, "Report not found.");

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const status = (body.body as { status?: unknown } | null)?.status;
  if (status !== "open" && status !== "resolved") {
    return errorResponse(400, 'status must be "open" or "resolved".');
  }

  const found = await setReportStatus(env.DB, id, status);
  return found ? json({ id, status }) : errorResponse(404, "Report not found.");
}
