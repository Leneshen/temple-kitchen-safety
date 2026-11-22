-- Run in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create table if not exists public.kitchen_safety_reports (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  submitted_by       text not null check (length(trim(submitted_by)) > 0),
  areas              text[] not null default '{}',
  checks             text[] not null default '{}',
  fridge_temp_c      numeric(4,1) check (fridge_temp_c between -30 and 30),
  incident_type      text not null default 'none'
                     check (incident_type in ('none','hazard','near_miss','injury','equipment_fault','spill')),
  hazards            text[] not null default '{}',
  severity           text check (severity in ('low','medium','high')),
  description        text not null default '',
  actions_taken      text[] not null default '{}',
  follow_up_required boolean not null default false,
  status             text not null default 'open' check (status in ('open','resolved'))
);

create index if not exists kitchen_safety_reports_open_idx
  on public.kitchen_safety_reports (created_at desc)
  where follow_up_required and status = 'open';

alter table public.kitchen_safety_reports enable row level security;

-- Volunteers submit without logging in.
create policy "anyone can submit a report"
  on public.kitchen_safety_reports for insert
  to anon with check (status = 'open');

-- Demo setting: anyone with the link can view reports and mark them resolved.
-- For real use, restrict these two policies to signed-in coordinators
-- (e.g. `to authenticated`) and add Supabase Auth to the Reports page.
create policy "read reports"
  on public.kitchen_safety_reports for select
  to anon using (true);

create policy "resolve reports"
  on public.kitchen_safety_reports for update
  to anon using (true) with check (status in ('open','resolved'));
