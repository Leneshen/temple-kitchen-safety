-- Kitchen safety reports. D1 is SQLite, so lists are stored as JSON text.
-- Apply with: npm run db:migrate:local   (or db:migrate:remote for production)

CREATE TABLE IF NOT EXISTS kitchen_safety_reports (
  id                 TEXT PRIMARY KEY,
  created_at         TEXT NOT NULL,
  submitted_by       TEXT NOT NULL CHECK (length(trim(submitted_by)) BETWEEN 1 AND 100),
  areas              TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(areas)),
  checks             TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(checks)),
  fridge_temp_c      REAL CHECK (fridge_temp_c BETWEEN -30 AND 30),
  incident_type      TEXT NOT NULL DEFAULT 'none'
                     CHECK (incident_type IN ('none','hazard','near_miss','injury','equipment_fault','spill')),
  hazards            TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(hazards)),
  severity           TEXT CHECK (severity IN ('low','medium','high')),
  description        TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  actions_taken      TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(actions_taken)),
  follow_up_required INTEGER NOT NULL DEFAULT 0 CHECK (follow_up_required IN (0, 1)),
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_at        TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_created
  ON kitchen_safety_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_open_follow_ups
  ON kitchen_safety_reports (created_at DESC)
  WHERE follow_up_required = 1 AND status = 'open';
