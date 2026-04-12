import { randomUUID } from "node:crypto";
import { defaultOnboarding, defaultProfile } from "@/data/mock/profile";
import { getSql } from "@/server/db/postgres";
import { stableHash } from "@/server/cache/keying";
import { type StudentReachRepository } from "@/server/repositories/types";
import { geocodeLocation } from "@/server/search/geocode";
import { type DraftAnalysis, type DraftGenerationInput, type OnboardingState, type OutreachDraft, type Professor, type SearchParams, type SearchResponse, type StudentProfile } from "@/types";

type ResearcherRow = {
  id: string;
  full_name: string;
  title: string | null;
  university_name: string;
  department: string | null;
  broad_field: Professor["field"];
  faculty_page_url: string | null;
  public_email: string | null;
  current_focus_summary: string | null;
  works_count: number;
  cited_by_count: number;
  is_assistant_professor: boolean;
  distance_miles: number | null;
  relevance_score: number | null;
};

type ResearcherDetailRow = {
  id: string;
  full_name: string;
  title: string | null;
  university_name: string;
  department: string | null;
  broad_field: Professor["field"];
  faculty_page_url: string | null;
  lab_page_url: string | null;
  public_email: string | null;
  bio_summary: string | null;
  current_focus_summary: string | null;
  what_they_actually_work_on: string | null;
  research_breakdown_cached: Professor["researchBreakdown"] | null;
  talking_points_cached: string[] | null;
  works_count: number;
  cited_by_count: number;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  keywords: Array<{ keyword: string; weight: number }>;
};

type PublicationRow = {
  id: string;
  title: string;
  publication_year: number | null;
  doi: string | null;
  source_url: string | null;
  abstract_text: string | null;
  topic_summary: string | null;
};

type StudentProfileRow = {
  display_name: string | null;
  location_text: string | null;
  default_radius_miles: number | null;
  primary_interest: string | null;
  field_bucket: Professor["field"] | null;
  projects_text: string | null;
  topic_familiarity: number | null;
  extra_background_text: string | null;
  resume_file_path: string | null;
};

type EmailDraftRow = {
  id: string;
  researcher_id: string;
  tone: OutreachDraft["tone"];
  draft_text: string;
  feedback_json: {
    subject?: string;
    outreachFeedback?: DraftAnalysis["outreachFeedback"];
  } | null;
  presend_check_json: {
    preSendCheck?: DraftAnalysis["preSendCheck"];
    readinessNudge?: string;
  } | null;
  status: OutreachDraft["status"];
  updated_at: string;
};

function mapResearcherRow(row: ResearcherRow, extras?: Partial<Professor>): Professor {
  return {
    id: row.id,
    name: row.full_name,
    title: (row.title as Professor["title"]) ?? "Professor",
    university: row.university_name,
    department: row.department ?? "Department unavailable",
    field: row.broad_field,
    city: extras?.city ?? "",
    state: extras?.state ?? "",
    latitude: extras?.latitude ?? 0,
    longitude: extras?.longitude ?? 0,
    facultyPage: row.faculty_page_url ?? "",
    email: row.public_email ?? "",
    researchTags: extras?.researchTags ?? [],
    currentFocus: row.current_focus_summary ?? extras?.currentFocus ?? "",
    whyFit: extras?.whyFit ?? "",
    workSummary: extras?.workSummary ?? "",
    researchBreakdown: extras?.researchBreakdown ?? [],
    goodTalkingPoints: extras?.goodTalkingPoints ?? [],
    recentPapers: extras?.recentPapers ?? [],
    recentPublicationCount: row.works_count,
    credibilitySignal: `${row.works_count} works · ${row.cited_by_count} citations`,
    summaryReady: Boolean(extras?.workSummary),
  };
}

export class PostgresRepository implements StudentReachRepository {
  async searchResearchers(params: SearchParams & { page?: number; pageSize?: number }): Promise<SearchResponse> {
    const sql = getSql();
    const pageSize = params.pageSize ?? 24;
    const page = params.page ?? 1;
    const pageOffset = (page - 1) * pageSize;
    const geocoded = geocodeLocation(params.location);

    const [university] = params.university && params.university !== "All"
      ? await sql<{ id: string }[]>`select id from public.universities where name = ${params.university} limit 1`
      : [];

    const rows = await sql<ResearcherRow[]>`
      select *
      from public.search_researchers(
        ${params.topic || null},
        ${null},
        ${geocoded?.latitude ?? null},
        ${geocoded?.longitude ?? null},
        ${params.radiusMiles},
        ${params.field && params.field !== "All" ? params.field : null},
        ${university?.id ?? null},
        ${params.titles?.length ? params.titles : null},
        ${pageSize},
        ${pageOffset}
      )
    `;

    const [countRow] = await sql<{ total: string }[]>`
      select public.search_researchers_count(
        ${params.topic || null},
        ${geocoded?.latitude ?? null},
        ${geocoded?.longitude ?? null},
        ${params.radiusMiles},
        ${params.field && params.field !== "All" ? params.field : null},
        ${university?.id ?? null},
        ${params.titles?.length ? params.titles : null}
      )::text as total
    `;

    const universities = await this.getUniversities();

    return {
      total: Number(countRow?.total ?? 0),
      results: rows.map((row) => mapResearcherRow(row)),
      universities,
    };
  }

  async getResearcher(id: string) {
    const sql = getSql();
    const [row] = await sql<ResearcherDetailRow[]>`
      select
        r.id,
        r.full_name,
        r.title,
        u.name as university_name,
        r.department,
        r.broad_field,
        r.faculty_page_url,
        r.lab_page_url,
        r.public_email,
        r.bio_summary,
        r.current_focus_summary,
        r.what_they_actually_work_on,
        r.research_breakdown_cached,
        r.talking_points_cached,
        r.works_count,
        r.cited_by_count,
        u.city,
        u.state,
        u.latitude,
        u.longitude,
        coalesce(
          json_agg(json_build_object('keyword', rk.keyword, 'weight', rk.weight) order by rk.weight desc)
          filter (where rk.id is not null),
          '[]'::json
        ) as keywords
      from public.researchers r
      join public.universities u on u.id = r.university_id
      left join public.researcher_keywords rk on rk.researcher_id = r.id
      where r.id = ${id}
      group by r.id, u.name, u.city, u.state, u.latitude, u.longitude
      limit 1
    `;

    if (!row) {
      return null;
    }

    const papers = await this.getResearcherPublications(id);

    return mapResearcherRow(
      {
        id: row.id,
        full_name: row.full_name,
        title: row.title,
        university_name: row.university_name,
        department: row.department,
        broad_field: row.broad_field,
        faculty_page_url: row.faculty_page_url,
        public_email: row.public_email,
        current_focus_summary: row.current_focus_summary,
        works_count: row.works_count,
        cited_by_count: row.cited_by_count,
        is_assistant_professor: row.title?.toLowerCase().includes("assistant professor") ?? false,
        distance_miles: null,
        relevance_score: null,
      },
      {
        city: row.city,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
        researchTags: (row.keywords as { keyword: string }[]).slice(0, 3).map((item) => item.keyword),
        currentFocus: row.current_focus_summary ?? "",
        whyFit: row.bio_summary ?? "",
        workSummary: row.what_they_actually_work_on ?? row.bio_summary ?? "",
        researchBreakdown: row.research_breakdown_cached ?? [],
        goodTalkingPoints: row.talking_points_cached ?? [],
        recentPapers: papers,
      },
    );
  }

  async getResearcherPublications(id: string) {
    const sql = getSql();
    const rows = await sql<PublicationRow[]>`
      select id, title, publication_year, doi, source_url, abstract_text, topic_summary
      from public.publications
      where researcher_id = ${id}
      order by publication_year desc nulls last, created_at desc
      limit 8
    `;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      venue: row.topic_summary ?? row.source_url ?? "Publication",
      year: row.publication_year ?? new Date().getFullYear(),
      summary: row.abstract_text ?? row.topic_summary ?? "No abstract stored yet.",
    }));
  }

  async getResearcherBreakdown(id: string) {
    const researcher = await this.getResearcher(id);
    if (!researcher) {
      return null;
    }

    return {
      workSummary: researcher.workSummary,
      researchBreakdown: researcher.researchBreakdown,
      whyFit: researcher.whyFit,
      currentFocus: researcher.currentFocus,
      goodTalkingPoints: researcher.goodTalkingPoints,
      recentPapers: researcher.recentPapers,
    };
  }

  async getStudentProfile(userId: string) {
    const sql = getSql();
    const [row] = await sql<StudentProfileRow[]>`select * from public.student_profiles where user_id = ${userId} limit 1`;
    if (!row) {
      return defaultProfile;
    }

    return {
      name: row.display_name ?? defaultProfile.name,
      email: defaultProfile.email,
      location: row.location_text ?? "",
      searchRadius: row.default_radius_miles ?? 150,
      interest: row.primary_interest ?? "",
      field: row.field_bucket ?? defaultProfile.field,
      projects: row.projects_text
        ? row.projects_text.split("\n").filter(Boolean).map((line: string, index: number) => ({
            id: `db-project-${index + 1}`,
            name: line.split(":")[0]?.trim() || `Project ${index + 1}`,
            summary: line.split(":").slice(1).join(":").trim() || line.trim(),
            relatedSkill: "Imported from profile",
          }))
        : [],
      hasPriorExposure: row.topic_familiarity ? row.topic_familiarity > 2 : null,
      familiarity: row.topic_familiarity ?? null,
      background: row.extra_background_text ?? "",
      resumeFileName: row.resume_file_path ?? undefined,
    };
  }

  async saveStudentProfile(userId: string, profile: StudentProfile) {
    const sql = getSql();
    await sql`
      insert into public.student_profiles (
        user_id,
        display_name,
        location_text,
        default_radius_miles,
        primary_interest,
        field_bucket,
        topic_familiarity,
        projects_text,
        extra_background_text,
        resume_file_path
      )
      values (
        ${userId},
        ${profile.name},
        ${profile.location},
        ${profile.searchRadius},
        ${profile.interest},
        ${profile.field},
        ${profile.familiarity},
        ${profile.projects.map((project) => `${project.name}: ${project.summary}`).join("\n")},
        ${profile.background},
        ${profile.resumeFileName ?? null}
      )
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        location_text = excluded.location_text,
        default_radius_miles = excluded.default_radius_miles,
        primary_interest = excluded.primary_interest,
        field_bucket = excluded.field_bucket,
        topic_familiarity = excluded.topic_familiarity,
        projects_text = excluded.projects_text,
        extra_background_text = excluded.extra_background_text,
        resume_file_path = excluded.resume_file_path
    `;

    return profile;
  }

  async getOnboarding(userId: string) {
    const profile = await this.getStudentProfile(userId);
    return { ...defaultOnboarding, profile };
  }

  async saveOnboarding(userId: string, state: OnboardingState) {
    await this.saveStudentProfile(userId, state.profile);
    return state;
  }

  async listSavedResearchers(userId: string) {
    const sql = getSql();
    const rows = await sql<{ researcher_id: string }[]>`
      select researcher_id from public.saved_researchers where user_id = ${userId} order by created_at desc
    `;
    return rows.map((row) => row.researcher_id);
  }

  async toggleSavedResearcher(userId: string, researcherId: string) {
    const sql = getSql();
    const existing = await sql<{ id: string }[]>`
      select id from public.saved_researchers where user_id = ${userId} and researcher_id = ${researcherId} limit 1
    `;
    if (existing.length) {
      await sql`delete from public.saved_researchers where id = ${existing[0].id}`;
    } else {
      await sql`
        insert into public.saved_researchers (user_id, researcher_id)
        values (${userId}, ${researcherId})
        on conflict (user_id, researcher_id) do nothing
      `;
    }
    return this.listSavedResearchers(userId);
  }

  async listDrafts(userId: string) {
    const sql = getSql();
    const rows = await sql<EmailDraftRow[]>`
      select id, researcher_id, tone, draft_text, feedback_json, presend_check_json, status, updated_at
      from public.email_drafts
      where user_id = ${userId}
      order by updated_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      professorId: row.researcher_id,
      tone: row.tone,
      subject: row.feedback_json?.subject ?? "Draft",
      content: row.draft_text,
      analysis: {
        outreachFeedback: row.feedback_json?.outreachFeedback ?? [],
        preSendCheck: row.presend_check_json?.preSendCheck ?? [],
        readinessNudge: row.presend_check_json?.readinessNudge ?? undefined,
      },
      status: row.status,
      updatedAt: row.updated_at,
    })) as OutreachDraft[];
  }

  async getDraft(userId: string, draftId: string) {
    return (await this.listDrafts(userId)).find((draft) => draft.id === draftId) ?? null;
  }

  async saveDraft(userId: string, draft: OutreachDraft) {
    const sql = getSql();
    await sql`
      insert into public.email_drafts (
        id, user_id, researcher_id, tone, context_snapshot_json, draft_text, feedback_json, presend_check_json, status
      )
      values (
        ${draft.id},
        ${userId},
        ${draft.professorId},
        ${draft.tone},
        ${JSON.stringify({ subject: draft.subject })}::jsonb,
        ${draft.content},
        ${JSON.stringify({ subject: draft.subject, outreachFeedback: draft.analysis.outreachFeedback })}::jsonb,
        ${JSON.stringify({
          preSendCheck: draft.analysis.preSendCheck,
          readinessNudge: draft.analysis.readinessNudge,
        })}::jsonb,
        ${draft.status}
      )
      on conflict (id) do update set
        tone = excluded.tone,
        context_snapshot_json = excluded.context_snapshot_json,
        draft_text = excluded.draft_text,
        feedback_json = excluded.feedback_json,
        presend_check_json = excluded.presend_check_json,
        status = excluded.status
    `;

    return draft;
  }

  async getUniversities() {
    const sql = getSql();
    const rows = await sql<{ name: string }[]>`select name from public.universities where active = true order by name asc`;
    return rows.map((row) => row.name);
  }

  async getCachedGeneration<T>(cacheKey: string) {
    const sql = getSql();
    const [row] = await sql<{ response_json: T }[]>`
      select response_json
      from public.ai_cache_entries
      where cache_key = ${cacheKey}
        and (expires_at is null or expires_at > timezone('utc', now()))
      limit 1
    `;
    return row?.response_json ?? null;
  }

  async setCachedGeneration<T>(cacheKey: string, value: T) {
    const sql = getSql();
    await sql`
      insert into public.ai_cache_entries (cache_key, job_type, context_hash, response_json)
      values (${cacheKey}, 'cached', ${stableHash(cacheKey)}, ${JSON.stringify(value)}::jsonb)
      on conflict (cache_key) do update set
        response_json = excluded.response_json,
        context_hash = excluded.context_hash,
        updated_at = timezone('utc', now())
    `;
  }

  async logSearchEvent(input: {
    userId?: string | null;
    queryText?: string;
    locationText?: string;
    locationLat?: number | null;
    locationLon?: number | null;
    radiusMiles?: number;
    fieldFilter?: string | null;
    universityFilter?: string | null;
    resultsCount: number;
  }) {
    const sql = getSql();
    await sql`
      insert into public.search_events (
        user_id, query_text, location_text, location_lat, location_lon, radius_miles, field_filter, university_filter, results_count
      )
      values (
        ${input.userId ?? null},
        ${input.queryText ?? null},
        ${input.locationText ?? null},
        ${input.locationLat ?? null},
        ${input.locationLon ?? null},
        ${input.radiusMiles ?? null},
        ${input.fieldFilter ?? null},
        ${input.universityFilter ?? null},
        ${input.resultsCount}
      )
    `;
  }

  async createDraftFromGeneration(userId: string, draft: Omit<OutreachDraft, "id" | "updatedAt">) {
    const hydrated: OutreachDraft = {
      ...draft,
      id: randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    return this.saveDraft(userId, hydrated);
  }

  async saveDraftFeedback(userId: string, draftId: string, analysis: DraftAnalysis) {
    const draft = await this.getDraft(userId, draftId);
    if (!draft) {
      return null;
    }

    const updated: OutreachDraft = {
      ...draft,
      analysis,
      updatedAt: new Date().toISOString(),
    };
    return this.saveDraft(userId, updated);
  }

  async getGenerationContext({ professorId, userId }: DraftGenerationInput & { userId?: string | null }) {
    const professor = await this.getResearcher(professorId);
    if (!professor) {
      throw new Error("Researcher not found.");
    }
    return {
      professor,
      profile: userId ? await this.getStudentProfile(userId) : null,
    };
  }
}
