-- Live Regulatory Intelligence core tables for sovereign agent ingestion.

create table if not exists public.government_announcements (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_label text not null,
  title text not null,
  announced_by text not null,
  announced_on date not null,
  effective_date date null,
  action_deadline date null,
  notification_ref text null,
  impact_score numeric(5,2) not null default 0,
  company_exposure text not null default 'medium' check (company_exposure in ('low', 'medium', 'high')),
  action_owner text not null default 'Compliance Operations',
  original_url text null,
  content_preview text null,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_government_announcements_announced_on
  on public.government_announcements (announced_on desc);

create index if not exists idx_government_announcements_exposure
  on public.government_announcements (company_exposure, announced_on desc);

create table if not exists public.regulatory_agent_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('success', 'partial', 'failed')),
  monitored_portals integer not null default 0,
  records_fetched integer not null default 0,
  records_inserted integer not null default 0,
  error_summary text null,
  created_at timestamptz not null default now()
);

alter table public.government_announcements enable row level security;
alter table public.regulatory_agent_sync_runs enable row level security;

drop policy if exists gov_announcements_read_policy on public.government_announcements;
create policy gov_announcements_read_policy
on public.government_announcements
for select
to authenticated
using (true);

drop policy if exists gov_sync_runs_read_policy on public.regulatory_agent_sync_runs;
create policy gov_sync_runs_read_policy
on public.regulatory_agent_sync_runs
for select
to authenticated
using (true);

create or replace function public.touch_government_announcements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_gov_announcements_updated_at on public.government_announcements;
create trigger trg_gov_announcements_updated_at
before update on public.government_announcements
for each row execute function public.touch_government_announcements_updated_at();
