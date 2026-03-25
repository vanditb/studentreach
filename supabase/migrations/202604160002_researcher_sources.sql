alter table public.researchers
  add column if not exists source text not null default 'openalex',
  add column if not exists source_confidence numeric(5,4) not null default 0.5000;

create index if not exists researchers_source_idx
  on public.researchers (source, source_confidence desc);

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
        case when r.source = 'faculty_page' then 0.18 else 0 end +
        least(coalesce(r.source_confidence, 0), 1) * 0.08 +
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
