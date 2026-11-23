import { beforeEach, describe, expect, it } from "vitest";
import { getReports, submitReport, updateReportStatus, type Env } from "../server/handlers";
import { createTestDb } from "./sqliteDb";

const post = (body: unknown, contentType = "application/json") =>
  new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const patch = (id: string, body: unknown) =>
  new Request(`http://localhost/api/reports/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const routine = { submittedBy: "Priya", areas: ["Floors"], checks: ["Gloves worn"] };

const spill = {
  submittedBy: "Raj",
  areas: ["Stovetops and burners"],
  incidentType: "spill",
  hazards: ["Hot surface or oil"],
  severity: "high",
  description: "Oil spilled near the stove",
  actionsTaken: ["Cleaned up"],
};

let env: Env;
beforeEach(() => {
  env = { DB: createTestDb() };
});

describe("POST /api/submit", () => {
  it("saves a routine check", async () => {
    const res = await submitReport(post(routine), env);
    expect(res.status).toBe(201);
    const { report } = (await res.json()) as { report: { status: string; followUpRequired: boolean } };
    expect(report.status).toBe("open");
    expect(report.followUpRequired).toBe(false);
  });

  it("enforces the follow-up rules on the server", async () => {
    const res = await submitReport(post({ ...spill, followUpRequired: false }), env);
    const { report } = (await res.json()) as { report: { followUpRequired: boolean } };
    expect(report.followUpRequired).toBe(true);

    const warm = await submitReport(post({ ...routine, fridgeTempC: 8 }), env);
    expect(((await warm.json()) as { report: { followUpRequired: boolean } }).report.followUpRequired).toBe(true);
  });

  it("rejects missing fields, unknown options and bad values", async () => {
    const res = await submitReport(
      post({ submittedBy: "", areas: ["Roof"], fridgeTempC: 90, incidentType: "spill" }),
      env,
    );
    expect(res.status).toBe(400);
    const { details } = (await res.json()) as { details: string[] };
    expect(details.join(" ")).toMatch(/submittedBy/);
    expect(details.join(" ")).toMatch(/unknown options: Roof/);
    expect(details.join(" ")).toMatch(/fridgeTempC/);
    expect(details.join(" ")).toMatch(/severity/);
  });

  it("rejects non-JSON and oversized bodies", async () => {
    expect((await submitReport(post("hello", "text/plain"), env)).status).toBe(415);
    expect((await submitReport(post("{not json"), env)).status).toBe(400);
    const huge = { ...routine, submittedBy: "x".repeat(20_000) };
    expect((await submitReport(post(huge), env)).status).toBe(413);
  });
});

describe("coordinator endpoints", () => {
  it("lists reports newest first and resolves them", async () => {
    await submitReport(post(routine), env);
    const created = (await (await submitReport(post(spill), env)).json()) as { report: { id: string } };

    const list = (await (await getReports(new Request("http://localhost/api/reports"), env)).json()) as {
      reports: { id: string; areas: string[]; status: string }[];
    };
    expect(list.reports).toHaveLength(2);
    expect(list.reports[0].areas).toEqual(["Stovetops and burners"]);

    const res = await updateReportStatus(patch(created.report.id, { status: "resolved" }), env, created.report.id);
    expect(res.status).toBe(200);
    const after = (await (await getReports(new Request("http://localhost/api/reports"), env)).json()) as {
      reports: { id: string; status: string }[];
    };
    expect(after.reports.find((r) => r.id === created.report.id)?.status).toBe("resolved");
  });

  it("returns 404 for unknown reports and 400 for bad statuses", async () => {
    const id = crypto.randomUUID();
    expect((await updateReportStatus(patch(id, { status: "resolved" }), env, id)).status).toBe(404);
    expect((await updateReportStatus(patch("not-an-id", { status: "resolved" }), env, "not-an-id")).status).toBe(404);
    expect((await updateReportStatus(patch(id, { status: "deleted" }), env, id)).status).toBe(400);
  });

  it("requires a Cloudflare Access token once Access is configured", async () => {
    const secured: Env = { ...env, ACCESS_TEAM_DOMAIN: "temple.cloudflareaccess.com", ACCESS_AUD: "aud" };
    const res = await getReports(new Request("http://localhost/api/reports"), secured);
    expect(res.status).toBe(401);
  });
});
