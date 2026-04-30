-- Production hardening for Regulon Agent regulatory intelligence pipeline.

create table if not exists public.regulatory_source_states (
  source text primary key,
  source_label text not null,
  source_url text not null,
  last_fetched_at timestamptz null,
  last_success_at timestamptz null,
  last_snapshot_hash text null,
  last_status text not null default 'idle' check (last_status in ('idle', 'success', 'partial', 'failed', 'rate_limited', 'skipped')),
  fail_count integer not null default 0,
  last_error text null,
  updated_at timestamptz not null default now()
);

create table if not exists public.regulatory_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source text not null references public.regulatory_source_states(source) on delete cascade,
  snapshot_hash text not null,
  content_digest text not null,
  item_count integer not null default 0,
  captured_at timestamptz not null default now()
);

create index if not exists idx_reg_source_snapshots_source_captured
  on public.regulatory_source_snapshots (source, captured_at desc);

create unique index if not exists uq_reg_source_snapshots_source_hash
  on public.regulatory_source_snapshots (source, snapshot_hash);

alter table public.government_announcements
  add column if not exists summary text null,
  add column if not exists category text null,
  add column if not exists source_url text null,
  add column if not exists published_date date null,
  add column if not exists detected_at timestamptz null,
  add column if not exists source_verified boolean not null default true;

update public.government_announcements
set
  summary = coalesce(summary, content_preview),
  source_url = coalesce(source_url, original_url),
  published_date = coalesce(published_date, announced_on),
  detected_at = coalesce(detected_at, created_at),
  category = coalesce(category, case
    when source in ('gstn', 'cbic') then 'GST'
    when source in ('incometax', 'cbdt') then 'Income Tax'
    when source = 'mca' then 'Corporate Law'
    else 'General'
  end)
where true;

alter table public.regulatory_source_states enable row level security;
alter table public.regulatory_source_snapshots enable row level security;

drop policy if exists reg_source_states_read_policy on public.regulatory_source_states;
create policy reg_source_states_read_policy
on public.regulatory_source_states
for select
to authenticated
using (true);

drop policy if exists reg_source_snapshots_read_policy on public.regulatory_source_snapshots;
create policy reg_source_snapshots_read_policy
on public.regulatory_source_snapshots
for select
to authenticated
using (true);

create or replace function public.touch_regulatory_source_states_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_regulatory_source_states_updated_at on public.regulatory_source_states;
create trigger trg_regulatory_source_states_updated_at
before update on public.regulatory_source_states
for each row execute function public.touch_regulatory_source_states_updated_at();
