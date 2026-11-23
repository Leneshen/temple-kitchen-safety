import { useEffect, useMemo, useState } from "react";
import { incidentLabel } from "../formConfig";
import { reportsToCsv } from "../lib/csv";
import { SignInRequiredError, type ReportStore } from "../lib/storage";
import type { Report } from "../types";

type Filter = "all" | "followup" | "incidents";

interface Props {
  store: ReportStore;
}

export function ReportsView({ store }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [filter, setFilter] = useState<Filter>("followup");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    store
      .list()
      .then((r) => !cancelled && setReports(r))
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof SignInRequiredError) setNeedsSignIn(true);
        else setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const openFollowUps = reports.filter((r) => r.followUpRequired && r.status === "open");
  const visible = useMemo(() => {
    if (filter === "followup") return openFollowUps;
    if (filter === "incidents") return reports.filter((r) => r.incidentType !== "none");
    return reports;
  }, [filter, reports, openFollowUps]);

  async function resolve(id: string) {
    try {
      await store.setStatus(id, "resolved");
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)));
    } catch (e) {
      if (e instanceof SignInRequiredError) setNeedsSignIn(true);
      else setError(e instanceof Error ? e.message : String(e));
    }
  }

  function exportCsv() {
    const blob = new Blob([reportsToCsv(reports)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kitchen-safety-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (needsSignIn) {
    return (
      <section className="card">
        <h2>Coordinator sign-in needed</h2>
        <p>Your sign-in has expired. Reload the page to sign in again.</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Reload and sign in
        </button>
      </section>
    );
  }
  if (loading) return <p className="card">Loading reports…</p>;
  if (error) return <p className="card error">Could not load reports: {error}</p>;

  const incidents = reports.filter((r) => r.incidentType !== "none").length;

  return (
    <section className="card">
      <div className="stats">
        <div>
          <strong>{reports.length}</strong>
          <span>checks recorded</span>
        </div>
        <div>
          <strong>{incidents}</strong>
          <span>incidents</span>
        </div>
        <div className={openFollowUps.length ? "alert" : ""}>
          <strong>{openFollowUps.length}</strong>
          <span>open follow-ups</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {(
            [
              ["followup", "Needs follow-up"],
              ["incidents", "Incidents"],
              ["all", "All checks"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} disabled={reports.length === 0}>
          Export CSV
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="empty">
          {filter === "followup" ? "Nothing needs following up." : "No checks recorded yet."}
        </p>
      ) : (
        <ul className="reports">
          {visible.map((r) => (
            <li key={r.id} className={`report severity-${r.severity ?? "none"}`}>
              <div className="report-head">
                <strong>{incidentLabel(r.incidentType)}</strong>
                <span>
                  {r.submittedBy} · {new Date(r.createdAt).toLocaleString("en-NZ")}
                </span>
              </div>
              <p>Areas: {r.areas.join(", ")}</p>
              {r.fridgeTempC !== null && <p>Fridge: {r.fridgeTempC}°C</p>}
              {r.description && <p>{r.description}</p>}
              {r.actionsTaken.length > 0 && <p>Done: {r.actionsTaken.join(", ")}</p>}
              <div className="report-foot">
                {r.severity && <span className="badge">{r.severity} severity</span>}
                {r.followUpRequired && (
                  <span className={`badge ${r.status}`}>
                    {r.status === "open" ? "Follow-up open" : "Resolved"}
                  </span>
                )}
                {r.followUpRequired && r.status === "open" && (
                  <button onClick={() => resolve(r.id)}>Mark resolved</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
