import { useMemo, useState } from "react";
import { SafetyForm } from "./components/SafetyForm";
import { ReportsView } from "./components/ReportsView";
import { createStore } from "./lib/storage";

type View = "form" | "reports";

export default function App() {
  const store = useMemo(createStore, []);
  const [view, setView] = useState<View>("form");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>Temple Kitchen Safety Check</h1>
        <p>Fill this in each time you clean the kitchen.</p>
        <nav>
          <button className={view === "form" ? "active" : ""} onClick={() => setView("form")}>
            New check
          </button>
          <button
            className={view === "reports" ? "active" : ""}
            onClick={() => setView("reports")}
          >
            Reports
          </button>
        </nav>
      </header>

      {store.mode === "demo" && (
        <p className="demo-banner">
          Demo mode: reports are saved in this browser only. Connect Supabase to share them.
        </p>
      )}

      <main>
        {view === "form" ? (
          <SafetyForm store={store} onSubmitted={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <ReportsView store={store} refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}
