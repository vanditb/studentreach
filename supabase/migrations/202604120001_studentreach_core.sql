create extension if not exists pgcrypto;
create extension if not exists vector;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  website_url text,
  faculty_directory_url text,
  openalex_institution_id text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.researchers (
  id uuid primary key default gen_random_uuid(),
  openalex_author_id text unique,
  full_name text not null,
  normalized_name text not null,
  title text,
  title_normalized text,
  is_professor boolean not null default false,
  is_assistant_professor boolean not null default false,
  university_id uuid not null references public.universities(id) on delete cascade,
  department text,
  broad_field text not null,
  specific_interests_text text,
  keywords_text text,
  faculty_page_url text,
  lab_page_url text,
  public_email text,
  bio_summary text,
  current_focus_summary text,
  past_research_themes jsonb not null default '[]'::jsonb,
  what_they_actually_work_on text,
  research_breakdown_cached jsonb,
  talking_points_cached jsonb,
  embedding vector(1536),
  works_count integer not null default 0,
  cited_by_count integer not null default 0,
  last_source_refresh_at timestamptz,
  last_ai_refresh_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.researcher_keywords (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.researchers(id) on delete cascade,
  keyword text not null,
  weight numeric(6,3) not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (researcher_id, keyword)
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.researchers(id) on delete cascade,
  openalex_work_id text,
  title text not null,
  publication_year integer,
  doi text,
  source_url text,
  abstract_text text,
  topic_summary text,
  is_recent boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (researcher_id, openalex_work_id)
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  location_text text,
  location_lat double precision,
  location_lon double precision,
  default_radius_miles integer not null default 150,
  primary_interest text,
  secondary_interest text,
  field_bucket text,
  topic_familiarity integer,
  projects_text text,
  coursework_text text,
  extra_background_text text,
  resume_file_path text,
  embedding vector(1536),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table if not exists public.saved_researchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  researcher_id uuid not null references public.researchers(id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, researcher_id)
);

create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  researcher_id uuid not null references public.researchers(id) on delete cascade,
  tone text not null,
  context_snapshot_json jsonb not null default '{}'::jsonb,
  draft_text text not null,
  feedback_json jsonb not null default '{}'::jsonb,
  presend_check_json jsonb not null default '{}'::jsonb,
  status text not null default 'Draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query_text text,
  location_text text,
  location_lat double precision,
  location_lon double precision,
  radius_miles integer,
  field_filter text,
  university_filter text,
  results_count integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid references public.researchers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  job_type text not null,
  input_hash text not null,
  status text not null default 'queued',
  response_cache_key text,
  error_text text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_cache_entries (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  researcher_id uuid references public.researchers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  job_type text not null,
  context_hash text not null,
  response_json jsonb not null default '{}'::jsonb,
  source_hash text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references public.researchers(id) on delete cascade,
  source_type text not null,
  source_url text,
  source_payload_json jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default timezone('utc', now())
);

create index if not exists universities_active_idx on public.universities (active);
create index if not exists universities_openalex_idx on public.universities (openalex_institution_id);
create index if not exists researchers_university_idx on public.researchers (university_id);
create index if not exists researchers_field_idx on public.researchers (broad_field);
create index if not exists researchers_title_flags_idx on public.researchers (is_professor, is_assistant_professor);
create index if not exists researchers_refresh_idx on public.researchers (last_source_refresh_at desc, last_ai_refresh_at desc);
create index if not exists publications_researcher_idx on public.publications (researcher_id, publication_year desc);
create index if not exists researcher_keywords_keyword_idx on public.researcher_keywords (keyword);
create index if not exists saved_researchers_user_idx on public.saved_researchers (user_id, created_at desc);
create index if not exists email_drafts_user_idx on public.email_drafts (user_id, updated_at desc);
create index if not exists search_events_created_idx on public.search_events (created_at desc);
create index if not exists generation_jobs_lookup_idx on public.generation_jobs (job_type, input_hash, status);
create index if not exists ai_cache_entries_lookup_idx on public.ai_cache_entries (job_type, context_hash, expires_at desc);

create index if not exists researchers_embedding_idx
  on public.researchers
  using hnsw (embedding vector_cosine_ops);

create index if not exists student_profiles_embedding_idx
  on public.student_profiles
  using hnsw (embedding vector_cosine_ops);

alter table public.researchers
  add column if not exists search_document tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(full_name, '') || ' ' ||
      coalesce(normalized_name, '') || ' ' ||
      coalesce(department, '') || ' ' ||
      coalesce(broad_field, '') || ' ' ||
      coalesce(keywords_text, '') || ' ' ||
      coalesce(specific_interests_text, '') || ' ' ||
      coalesce(current_focus_summary, '') || ' ' ||
      coalesce(bio_summary, '')
    )
  ) stored;

create index if not exists researchers_search_document_idx
  on public.researchers using gin (search_document);

create or replace function public.miles_between(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select 3958.8 * acos(
    least(
      1,
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2 - lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
$$;

create or replace function public.search_researchers(
  query_text text default null,
  query_embedding vector(1536) default null,
  search_lat double precision default null,
  search_lon double precision default null,
  radius_miles integer default 3000,
  requested_field text default null,
  requested_university uuid default null,
  include_titles text[] default null,
  page_size integer default 24,
  page_offset integer default 0
)
returns table (
  id uuid,
  full_name text,
  title text,
  university_name text,
  department text,
  broad_field text,
  faculty_page_url text,
  public_email text,
  current_focus_summary text,
  works_count integer,
  cited_by_count integer,
  is_assistant_professor boolean,
  distance_miles double precision,
  relevance_score double precision
)
language sql
stable
as $$
  with ranked as (
    select
      r.id,
      r.full_name,
      r.title,
      u.name as university_name,
      r.department,
      r.broad_field,
      r.faculty_page_url,
      r.public_email,
      r.current_focus_summary,
      r.works_count,
      r.cited_by_count,
      r.is_assistant_professor,
      case
        when search_lat is not null and search_lon is not null
          then public.miles_between(search_lat, search_lon, u.latitude, u.longitude)
        else null
      end as distance_miles,
      (
        coalesce(ts_rank(r.search_document, websearch_to_tsquery('english', nullif(query_text, ''))), 0) * 0.45 +
        case
          when query_embedding is not null and r.embedding is not null then greatest(0, 1 - (r.embedding <=> query_embedding)) * 0.35
          else 0
        end +
        case when requested_field is not null and r.broad_field = requested_field then 0.12 else 0 end +
        case when r.is_assistant_professor then 0.03 else 0 end +
        least(r.works_count / 250.0, 0.03) +
        least(r.cited_by_count / 10000.0, 0.02)
      ) as relevance_score
    from public.researchers r
    join public.universities u on u.id = r.university_id
    where
      u.active = true
      and (requested_field is null or r.broad_field = requested_field)
      and (requested_university is null or r.university_id = requested_university)
      and (
        include_titles is null
        or array_length(include_titles, 1) is null
        or coalesce(r.title_normalized, r.title) = any(include_titles)
      )
      and (
        search_lat is null
        or search_lon is null
        or public.miles_between(search_lat, search_lon, u.latitude, u.longitude) <= radius_miles
      )
      and (
        nullif(query_text, '') is null
        or r.search_document @@ websearch_to_tsquery('english', query_text)
        or r.full_name ilike ('%' || query_text || '%')
        or r.keywords_text ilike ('%' || query_text || '%')
        or r.specific_interests_text ilike ('%' || query_text || '%')
      )
  )
  select *
  from ranked
  order by relevance_score desc nulls last, cited_by_count desc, works_count desc
  limit greatest(page_size, 1)
  offset greatest(page_offset, 0);
$$;

create or replace function public.search_researchers_count(
  query_text text default null,
  search_lat double precision default null,
  search_lon double precision default null,
  radius_miles integer default 3000,
  requested_field text default null,
  requested_university uuid default null,
  include_titles text[] default null
)
returns bigint
language sql
stable
as $$
  select count(*)
  from public.researchers r
  join public.universities u on u.id = r.university_id
  where
    u.active = true
    and (requested_field is null or r.broad_field = requested_field)
    and (requested_university is null or r.university_id = requested_university)
    and (
      include_titles is null
      or array_length(include_titles, 1) is null
      or coalesce(r.title_normalized, r.title) = any(include_titles)
    )
    and (
      search_lat is null
      or search_lon is null
      or public.miles_between(search_lat, search_lon, u.latitude, u.longitude) <= radius_miles
    )
    and (
      nullif(query_text, '') is null
      or r.search_document @@ websearch_to_tsquery('english', query_text)
      or r.full_name ilike ('%' || query_text || '%')
      or r.keywords_text ilike ('%' || query_text || '%')
      or r.specific_interests_text ilike ('%' || query_text || '%')
    );
$$;

drop trigger if exists universities_set_updated_at on public.universities;
create trigger universities_set_updated_at
before update on public.universities
for each row execute function public.set_updated_at();

drop trigger if exists researchers_set_updated_at on public.researchers;
create trigger researchers_set_updated_at
before update on public.researchers
for each row execute function public.set_updated_at();

drop trigger if exists publications_set_updated_at on public.publications;
create trigger publications_set_updated_at
before update on public.publications
for each row execute function public.set_updated_at();

drop trigger if exists student_profiles_set_updated_at on public.student_profiles;
create trigger student_profiles_set_updated_at
before update on public.student_profiles
for each row execute function public.set_updated_at();

drop trigger if exists email_drafts_set_updated_at on public.email_drafts;
create trigger email_drafts_set_updated_at
before update on public.email_drafts
for each row execute function public.set_updated_at();

drop trigger if exists generation_jobs_set_updated_at on public.generation_jobs;
create trigger generation_jobs_set_updated_at
before update on public.generation_jobs
for each row execute function public.set_updated_at();

drop trigger if exists ai_cache_entries_set_updated_at on public.ai_cache_entries;
create trigger ai_cache_entries_set_updated_at
before update on public.ai_cache_entries
for each row execute function public.set_updated_at();

alter table public.universities enable row level security;
alter table public.researchers enable row level security;
alter table public.researcher_keywords enable row level security;
alter table public.publications enable row level security;
alter table public.student_profiles enable row level security;
alter table public.saved_researchers enable row level security;
alter table public.email_drafts enable row level security;
alter table public.search_events enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.ai_cache_entries enable row level security;
alter table public.source_snapshots enable row level security;

drop policy if exists "public can read universities" on public.universities;
create policy "public can read universities"
  on public.universities
  for select
  using (true);

drop policy if exists "public can read researchers" on public.researchers;
create policy "public can read researchers"
  on public.researchers
  for select
  using (true);

drop policy if exists "public can read researcher keywords" on public.researcher_keywords;
create policy "public can read researcher keywords"
  on public.researcher_keywords
  for select
  using (true);

drop policy if exists "public can read publications" on public.publications;
create policy "public can read publications"
  on public.publications
  for select
  using (true);

drop policy if exists "users can manage their profile" on public.student_profiles;
create policy "users can manage their profile"
  on public.student_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage their saved researchers" on public.saved_researchers;
create policy "users can manage their saved researchers"
  on public.saved_researchers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage their drafts" on public.email_drafts;
create policy "users can manage their drafts"
  on public.email_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can read their search events" on public.search_events;
create policy "users can read their search events"
  on public.search_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "users can insert their search events" on public.search_events;
create policy "users can insert their search events"
  on public.search_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can manage their generation jobs" on public.generation_jobs;
create policy "users can manage their generation jobs"
  on public.generation_jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can read their ai cache entries" on public.ai_cache_entries;
create policy "users can read their ai cache entries"
  on public.ai_cache_entries
  for select
  using (auth.uid() = user_id or user_id is null);
