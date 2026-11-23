import { describe, expect, it } from "vitest";
import { LocalStore } from "../src/lib/storage";
import type { NewReport } from "../src/types";

const sample: NewReport = {
  submittedBy: "Anita",
  areas: ["Sinks and dishwasher"],
  checks: ["Gloves worn"],
  fridgeTempC: null,
  incidentType: "hazard",
  hazards: ["Wet or slippery floor"],
  severity: "medium",
  description: "Leak under sink",
  actionsTaken: ["Area cordoned off"],
  followUpRequired: true,
};

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("LocalStore (demo mode)", () => {
  it("adds, lists and resolves reports, and persists them", async () => {
    const storage = memoryStorage();
    const store = new LocalStore(storage);
    const saved = await store.add(sample);
    await store.setStatus(saved.id, "resolved");
    const reloaded = await new LocalStore(storage).list();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].status).toBe("resolved");
  });
});
