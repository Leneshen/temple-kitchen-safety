import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { Db } from "../server/db";

/**
 * A D1-compatible wrapper around Node's built-in SQLite, so the API is tested against
 * the real migration and real SQL (D1 is SQLite underneath).
 */
export function createTestDb(): Db {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_create_reports.sql", import.meta.url), "utf8"));
  return {
    prepare(sql: string) {
      const stmt = sqlite.prepare(sql);
      return {
        bind(...values: unknown[]) {
          const args = values as (string | number | null)[];
          return {
            async run() {
              const r = stmt.run(...args);
              return { meta: { changes: Number(r.changes) } };
            },
            async all<T>() {
              return { results: stmt.all(...args) as T[] };
            },
            async first<T>() {
              return (stmt.get(...args) as T | undefined) ?? null;
            },
          };
        },
      };
    },
  };
}
