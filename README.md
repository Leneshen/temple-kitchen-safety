# Temple Kitchen Safety Check

A mobile-friendly health and safety form for volunteers who clean the kitchen at the Sri Balaji Temple in Hamilton, New Zealand, plus a reports page for the kitchen coordinator.

Volunteers tap selection boxes instead of typing, so a check takes about a minute on a phone. The coordinator sees every check, filters to the ones that need follow-up, marks them resolved and exports everything to CSV.

![Form and reports screens](docs/screenshot.png)

**Live demo:** `https://<your-github-username>.github.io/temple-kitchen-safety/`

## What it does

- **Tap-to-select form:** areas cleaned, safety checks completed, fridge temperature, and whether anything happened (hazard, near miss, spill, equipment fault or injury).
- **Follow-up questions only when needed:** hazard type, severity, what happened and what was done appear only if something was reported.
- **Built-in safety rules:** a fridge reading above 5°C or any high-severity incident is automatically flagged for follow-up, with an on-screen prompt to tell the coordinator (and to call 111 if anyone is in danger).
- **Validation with clear messages:** required fields and implausible readings are caught before submission.
- **Coordinator reports:** totals, open follow-ups, incident filter, "Mark resolved" and CSV export for committee meetings.
- **Accessible:** selection boxes are real checkboxes and radio buttons, so they work with keyboards and screen readers.

## Tech

- React 19 + TypeScript, built with Vite
- Supabase (Postgres) for shared storage, with row-level security
- Falls back to browser storage when no database is configured, so the public demo works with no setup
- Vitest unit tests for validation rules, CSV export and the data layer
- GitHub Actions runs the tests, builds and deploys to GitHub Pages on every push to `main`

```
src/
  App.tsx                  navigation between form and reports
  formConfig.ts            all form options in one place (edit to suit the kitchen)
  components/ChipGroup.tsx accessible selection-box component
  components/SafetyForm.tsx
  components/ReportsView.tsx
  lib/validate.ts          validation and follow-up rules
  lib/storage.ts           Supabase and local storage behind one interface
  lib/csv.ts               CSV export
supabase/schema.sql        table, constraints and access policies
```

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
```

Without Supabase keys the app runs in demo mode and saves reports in your browser.

## Connect Supabase (shared database)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste in `supabase/schema.sql` and run it.
3. Copy `.env.example` to `.env.local` and add your **Project URL** and **anon public key** from **Project Settings > API**.
4. Restart `npm run dev`. The demo banner disappears and reports are saved to the database.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository named `temple-kitchen-safety`.
2. In the repository, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. To use Supabase on the live site, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings > Secrets and variables > Actions**. Leave them out to publish in demo mode.
4. Push to `main`. The workflow tests, builds and deploys the site.

## Security note

The anon key is public by design; access is controlled by the row-level security policies in `schema.sql`. In the current demo setup, anyone with the link can view reports and mark them resolved. Before real use, restrict the read and update policies to signed-in coordinators and add Supabase Auth to the Reports page.

## Customising

All checklist options live in `src/formConfig.ts`. Edit the lists there to match the temple's own kitchen procedures; no other code needs to change.
