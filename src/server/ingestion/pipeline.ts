import { getSql, withTransaction } from "@/server/db/postgres";
import { seededUniversities } from "@/data/seed/universities";
import { enrichFromFacultyDirectory } from "@/server/ingestion/faculty-enrichment";
import { OpenAlexClient } from "@/server/ingestion/openalex-client";
import { inferBroadFieldFromKeywords, normalizeResearcherName, normalizeResearcherTitle, summarizeCurrentFocus, summarizeWorks } from "@/server/ingestion/normalize";
import { fieldKeywords } from "@/server/search/field-mapping";
import { type Field } from "@/types";

const trackedFields: Field[] = [
  "Computer Science / AI",
  "Biology / Biotech",
  "Physics",
  "Engineering",
  "Psychology / Neuroscience",
  "Economics / Social Science",
  "Chemistry",
];

export class StudentReachIngestionPipeline {
  constructor(private readonly openAlex = new OpenAlexClient()) {}

  async seedUniversities() {
    const sql = getSql();
    for (const university of seededUniversities) {
      await sql`
        insert into public.universities (
          name, slug, city, state, latitude, longitude, website_url, active
        )
        values (
          ${university.name},
          ${university.slug},
          ${university.city},
          ${university.state},
          ${university.latitude},
          ${university.longitude},
          ${university.websiteUrl},
          true
        )
        on conflict (slug) do update set
          name = excluded.name,
          city = excluded.city,
          state = excluded.state,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          website_url = excluded.website_url,
          active = true
      `;
    }
  }

  async mapOpenAlexInstitutions() {
    const sql = getSql();
    const universities = await sql<{ id: string; name: string }[]>`
      select id, name from public.universities where openalex_institution_id is null or openalex_institution_id = ''
    `;

    for (const university of universities) {
      const matches = await this.openAlex.searchInstitutionByName(university.name);
      const best = matches[0];
      if (!best) {
        continue;
      }

      await sql`
        update public.universities
        set
          openalex_institution_id = ${best.id},
          website_url = coalesce(${best.homepage_url ?? null}, website_url),
          latitude = coalesce(${best.geo?.latitude ?? null}, latitude),
          longitude = coalesce(${best.geo?.longitude ?? null}, longitude),
          city = coalesce(${best.geo?.city ?? null}, city),
          state = coalesce(${best.geo?.region ?? null}, state)
        where id = ${university.id}
      `;
    }
  }

  async ingestResearchers(limitPerField = 15) {
    const sql = getSql();
    const universities = await sql<{ id: string; openalex_institution_id: string; name: string; faculty_directory_url: string | null }[]>`
      select id, openalex_institution_id, name, faculty_directory_url
      from public.universities
      where active = true and openalex_institution_id is not null
    `;

    for (const university of universities) {
      for (const field of trackedFields) {
        const primaryKeyword = fieldKeywords(field)[0] ?? field;
        const works = await this.openAlex.getInstitutionWorks(university.openalex_institution_id, primaryKeyword, limitPerField);

        for (const work of works) {
          for (const authorship of work.authorships ?? []) {
            if (!authorship.author?.id) {
              continue;
            }

            const author = await this.openAlex.getAuthor(authorship.author.id);
            const authorWorks = await this.openAlex.getAuthorWorks(authorship.author.id, 6);
            const summaries = summarizeWorks(authorWorks);
            const enrichment = await enrichFromFacultyDirectory({
              directoryUrl: university.faculty_directory_url,
              researcherName: author.display_name,
            });
            const normalizedTitle = normalizeResearcherTitle(enrichment.title);
            const inferredField = inferBroadFieldFromKeywords(
              `${summaries.keywordsText} ${(work.concepts ?? []).map((concept) => concept.display_name).join(" ")}`,
              field,
            );

            await withTransaction(async (tx) => {
              const [researcher] = await tx<{ id: string }[]>`
                insert into public.researchers (
                  openalex_author_id,
                  full_name,
                  normalized_name,
                  title,
                  title_normalized,
                  is_professor,
                  is_assistant_professor,
                  university_id,
                  department,
                  broad_field,
                  specific_interests_text,
                  keywords_text,
                  faculty_page_url,
                  public_email,
                  bio_summary,
                  current_focus_summary,
                  past_research_themes,
                  works_count,
                  cited_by_count,
                  last_source_refresh_at
                )
                values (
                  ${author.id},
                  ${author.display_name},
                  ${normalizeResearcherName(author.display_name)},
                  ${normalizedTitle.normalizedTitle},
                  ${normalizedTitle.normalizedTitle},
                  ${normalizedTitle.isProfessor},
                  ${normalizedTitle.isAssistantProfessor},
                  ${university.id},
                  ${null},
                  ${inferredField},
                  ${summaries.keywordsText},
                  ${summaries.keywordsText},
                  ${enrichment.facultyPageUrl},
                  ${enrichment.publicEmail},
                  ${summaries.bioSummary},
                  ${summarizeCurrentFocus(authorWorks)},
                  ${JSON.stringify(summaries.pastThemes)}::jsonb,
                  ${author.works_count},
                  ${author.cited_by_count},
                  timezone('utc', now())
                )
                on conflict (openalex_author_id) do update set
                  full_name = excluded.full_name,
                  normalized_name = excluded.normalized_name,
                  university_id = excluded.university_id,
                  broad_field = excluded.broad_field,
                  specific_interests_text = excluded.specific_interests_text,
                  keywords_text = excluded.keywords_text,
                  faculty_page_url = coalesce(excluded.faculty_page_url, public.researchers.faculty_page_url),
                  public_email = coalesce(excluded.public_email, public.researchers.public_email),
                  bio_summary = excluded.bio_summary,
                  current_focus_summary = excluded.current_focus_summary,
                  past_research_themes = excluded.past_research_themes,
                  works_count = excluded.works_count,
                  cited_by_count = excluded.cited_by_count,
                  last_source_refresh_at = excluded.last_source_refresh_at
                returning id
              `;

              await tx`delete from public.researcher_keywords where researcher_id = ${researcher.id}`;

              for (const keyword of summaries.keywordsText.split(",").map((item) => item.trim()).filter(Boolean)) {
                await tx`
                  insert into public.researcher_keywords (researcher_id, keyword, weight)
                  values (${researcher.id}, ${keyword}, 1)
                `;
              }

              for (const recentWork of authorWorks) {
                await tx`
                  insert into public.publications (
                    researcher_id,
                    openalex_work_id,
                    title,
                    publication_year,
                    doi,
                    source_url,
                    abstract_text,
                    topic_summary,
                    is_recent
                  )
                  values (
                    ${researcher.id},
                    ${recentWork.id},
                    ${recentWork.title},
                    ${recentWork.publication_year},
                    ${recentWork.doi},
                    ${recentWork.primary_location?.landing_page_url ?? null},
                    ${recentWork.abstract_inverted_index ? Object.keys(recentWork.abstract_inverted_index).join(" ") : null},
                    ${(recentWork.concepts ?? []).slice(0, 3).map((concept) => concept.display_name).join(", ")},
                    ${recentWork.publication_year ? recentWork.publication_year >= new Date().getFullYear() - 4 : false}
                  )
                  on conflict (researcher_id, openalex_work_id) do update set
                    title = excluded.title,
                    publication_year = excluded.publication_year,
                    doi = excluded.doi,
                    source_url = excluded.source_url,
                    abstract_text = excluded.abstract_text,
                    topic_summary = excluded.topic_summary,
                    is_recent = excluded.is_recent
                `;
              }

              await tx`
                insert into public.source_snapshots (researcher_id, source_type, source_url, source_payload_json)
                values (
                  ${researcher.id},
                  'openalex-author',
                  ${author.id},
                  ${JSON.stringify(author)}::jsonb
                )
              `;
            });
          }
        }
      }
    }
  }
}
