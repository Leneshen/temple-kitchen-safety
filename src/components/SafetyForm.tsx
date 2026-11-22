import { useState, type FormEvent } from "react";
import { ChipGroup } from "./ChipGroup";
import {
  ACTIONS,
  AREAS,
  CHECKS,
  FRIDGE_MAX_C,
  HAZARDS,
  INCIDENT_TYPES,
  SEVERITIES,
} from "../formConfig";
import {
  emptyDraft,
  fridgeOutOfRange,
  hasIncident,
  toNewReport,
  validate,
  type Errors,
} from "../lib/validate";
import type { ReportStore } from "../lib/storage";
import type { ReportDraft } from "../types";

interface Props {
  store: ReportStore;
  onSubmitted: () => void;
}

export function SafetyForm({ store, onSubmitted }: Props) {
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [done, setDone] = useState(false);

  const set = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const missedChecks = CHECKS.filter((c) => !draft.checks.includes(c));
  const incident = hasIncident(draft);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.querySelector(".has-error, [aria-invalid='true']")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await store.add(toNewReport(draft));
      setDone(true);
      onSubmitted();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the report.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <section className="card done" aria-live="polite">
        <h2>Thank you, the check is recorded</h2>
        <p>The kitchen coordinator can see it under Reports.</p>
        <button
          className="primary"
          onClick={() => {
            setDraft(emptyDraft());
            setDone(false);
          }}
        >
          Start a new check
        </button>
      </section>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>1. Who and where</h2>
      <label className={`field${errors.submittedBy ? " has-error" : ""}`}>
        <span>Your name</span>
        <input
          value={draft.submittedBy}
          onChange={(e) => set("submittedBy", e.target.value)}
          autoComplete="name"
          aria-invalid={!!errors.submittedBy}
        />
        {errors.submittedBy && <span className="error">{errors.submittedBy}</span>}
      </label>
      <ChipGroup
        multiple
        legend="Areas you cleaned"
        hint="Select all that apply."
        options={AREAS}
        value={draft.areas}
        onChange={(v) => set("areas", v)}
        error={errors.areas}
      />

      <h2>2. Safety checks</h2>
      <ChipGroup
        multiple
        legend="What did you do?"
        hint="Tick each check you completed."
        options={CHECKS}
        value={draft.checks}
        onChange={(v) => set("checks", v)}
      />
      {draft.checks.length > 0 && missedChecks.length > 0 && (
        <p className="notice">
          {missedChecks.length} check{missedChecks.length > 1 ? "s" : ""} not ticked. That's
          okay if it didn't apply today.
        </p>
      )}
      <label className={`field short${errors.fridgeTempC ? " has-error" : ""}`}>
        <span>Fridge temperature (°C), if checked</span>
        <input
          inputMode="decimal"
          value={draft.fridgeTempC}
          onChange={(e) => set("fridgeTempC", e.target.value)}
          aria-invalid={!!errors.fridgeTempC}
        />
        {errors.fridgeTempC && <span className="error">{errors.fridgeTempC}</span>}
      </label>
      {fridgeOutOfRange(draft) && !errors.fridgeTempC && (
        <p className="warning" role="status">
          Above {FRIDGE_MAX_C}°C. This will be flagged for follow-up. Please tell the kitchen
          coordinator today.
        </p>
      )}

      <h2>3. Did anything happen?</h2>
      <ChipGroup
        legend="Choose one"
        options={INCIDENT_TYPES}
        value={draft.incidentType}
        onChange={(v) => set("incidentType", v)}
      />

      {incident && (
        <div className="incident">
          <ChipGroup
            multiple
            legend="What kind of hazard?"
            hint="Select any that apply."
            options={HAZARDS}
            value={draft.hazards}
            onChange={(v) => set("hazards", v)}
          />
          <ChipGroup
            legend="How serious was it?"
            options={SEVERITIES}
            value={draft.severity}
            onChange={(v) => set("severity", v)}
            error={errors.severity}
          />
          <label className={`field${errors.description ? " has-error" : ""}`}>
            <span>What happened?</span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </label>
          <ChipGroup
            multiple
            legend="What was done about it?"
            options={ACTIONS}
            value={draft.actionsTaken}
            onChange={(v) => set("actionsTaken", v)}
            error={errors.actionsTaken}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={draft.followUpRequired}
              onChange={(e) => set("followUpRequired", e.target.checked)}
            />
            <span>Someone needs to follow this up</span>
          </label>
          {draft.severity === "high" && (
            <p className="warning" role="status">
              High severity reports are always flagged for follow-up. If anyone is hurt or in
              danger, call 111 first.
            </p>
          )}
        </div>
      )}

      <h2>4. Sign off</h2>
      <label className={`toggle${errors.confirmed ? " has-error" : ""}`}>
        <input
          type="checkbox"
          checked={draft.confirmed}
          onChange={(e) => set("confirmed", e.target.checked)}
        />
        <span>I confirm this information is correct to the best of my knowledge.</span>
      </label>
      {errors.confirmed && <p className="error">{errors.confirmed}</p>}

      {saveError && (
        <p className="error" role="alert">
          {saveError}
        </p>
      )}
      <button className="primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Submit check"}
      </button>
    </form>
  );
}
