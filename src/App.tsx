import { useMemo } from "react";
import { SafetyForm } from "./components/SafetyForm";
import { ReportsView } from "./components/ReportsView";
import { createStore } from "./lib/storage";

// The reports page lives at /admin so Cloudflare Access can protect that path
// (and /api/reports) while the form at / stays open to volunteers.
const isReportsPage = () => window.location.pathname.replace(/\/+$/, "").endsWith("/admin");

export default function App() {
  const store = useMemo(createStore, []);
  const reports = isReportsPage();

  return (
    <div className="app">
      <header>
        <h1>Temple Kitchen Safety Check</h1>
        <p>
          {reports
            ? "Kitchen coordinator view: follow up on reported issues."
            : "Fill this in each time you clean the kitchen."}
        </p>
        <nav>
          <a href="/" className={reports ? "" : "active"} aria-current={reports ? undefined : "page"}>
            New check
          </a>
          <a href="/admin" className={reports ? "active" : ""} aria-current={reports ? "page" : undefined}>
            Reports
          </a>
        </nav>
      </header>

      {store.mode === "demo" && (
        <p className="demo-banner">
          Demo mode: reports are saved in this browser only. Deploy to Cloudflare to share them.
        </p>
      )}

      <main>{reports ? <ReportsView store={store} /> : <SafetyForm store={store} />}</main>
    </div>
  );
}
