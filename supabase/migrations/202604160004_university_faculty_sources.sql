create table if not exists public.university_faculty_sources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  field text not null,
  source_url text not null,
  page_kind text not null,
  confidence numeric(5,4) not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (university_id, field)
);

create index if not exists university_faculty_sources_lookup_idx
  on public.university_faculty_sources (university_id, field, confidence desc);

alter table public.university_faculty_sources enable row level security;

drop policy if exists "public can read university faculty sources" on public.university_faculty_sources;
create policy "public can read university faculty sources"
  on public.university_faculty_sources
  for select
  using (true);
