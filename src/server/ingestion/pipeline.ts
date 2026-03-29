import { getSql, withTransaction } from "@/server/db/postgres";
import { seededUniversities } from "@/data/seed/universities";
import { getSeededFacultySource } from "@/data/seed/faculty-sources";
import { enrichFromFacultyDirectory } from "@/server/ingestion/faculty-enrichment";
import { OpenAlexClient, type OpenAlexAuthor, type OpenAlexWork } from "@/server/ingestion/openalex-client";
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

const prioritizedUniversityNames = new Set([
  "Rutgers University",
  "New Jersey Institute of Technology",
  "Princeton University",
  "Stevens Institute of Technology",
  "Yale University",
  "Massachusetts Institute of Technology",
  "Columbia University",
  "New York University",
]);

const cachableFacultyPageKinds = new Set([
  "department_faculty",
  "department_directory",
  "subschool_faculty",
]);

function isEducationInstitution(type: string | null | undefined) {
  const normalized = (type ?? "").trim().toLowerCase();
  return normalized === "education" || normalized.includes("university") || normalized.includes("college") || normalized.includes("school");
}

function getKeywordList(keywordsText: string) {
  return keywordsText.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

function hasTrustedFallbackUniversityMatch(author: OpenAlexAuthor, universityInstitutionId: string) {
  const primaryInstitution = author.last_known_institutions?.[0];
  if (!primaryInstitution || primaryInstitution.id !== universityInstitutionId || !isEducationInstitution(primaryInstitution.type)) {
    return false;
  }

  const currentYear = new Date().getFullYear();
  const exactRecentAffiliation = (author.affiliations ?? []).some((affiliation) =>
    affiliation.institution.id === universityInstitutionId
    && isEducationInstitution(affiliation.institution.type)
    && (affiliation.years ?? []).some((year) => year >= currentYear - 3),
  );

  if (!exactRecentAffiliation) {
    return false;
  }

  const competingRecentNonEducation = (author.affiliations ?? []).some((affiliation) =>
    affiliation.institution.id !== universityInstitutionId
    && !isEducationInstitution(affiliation.institution.type)
    && (affiliation.years ?? []).some((year) => year >= currentYear - 1),
  );

  return !competingRecentNonEducation;
}

function estimateProfessorLikelihood({
  author,
  authorWorks,
  keywordCount,
  facultySignalStrength,
}: {
  author: OpenAlexAuthor;
  authorWorks: OpenAlexWork[];
  keywordCount: number;
  facultySignalStrength: number;
}) {
  let score = 0.22;

  if (facultySignalStrength > 0) {
    score += Math.min(facultySignalStrength, 0.12);
  }

  if (author.works_count >= 120) {
    score += 0.24;
  } else if (author.works_count >= 60) {
    score += 0.18;
  } else if (author.works_count >= 25) {
    score += 0.1;
  }

  if (author.cited_by_count >= 2500) {
    score += 0.22;
  } else if (author.cited_by_count >= 750) {
    score += 0.16;
  } else if (author.cited_by_count >= 200) {
    score += 0.1;
  }

  const hIndex = author.summary_stats?.h_index ?? 0;
  if (hIndex >= 35) {
    score += 0.18;
  } else if (hIndex >= 20) {
    score += 0.12;
  } else if (hIndex >= 12) {
    score += 0.07;
  }

  const currentYear = new Date().getFullYear();
  const recentWorkCount = authorWorks.filter((work) => work.publication_year && work.publication_year >= currentYear - 5).length;
  if (recentWorkCount >= 5) {
    score += 0.08;
  } else if (recentWorkCount >= 2) {
    score += 0.04;
  }

  if (keywordCount >= 5) {
    score += 0.08;
  } else if (keywordCount >= 3) {
    score += 0.05;
  } else if (keywordCount >= 1) {
    score += 0.02;
  }

  return Math.min(Number(score.toFixed(4)), 0.99);
}

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

  async resetResearchData() {
    await withTransaction(async (tx) => {
      await tx`delete from public.publications`;
      await tx`delete from public.researcher_keywords`;
      await tx`delete from public.source_snapshots`;
      await tx`delete from public.researchers`;
      await tx`delete from public.university_faculty_sources`;
    });
  }

  async ingestResearchers(limitPerField = 15) {
    const sql = getSql();
    const universities = await sql<{ id: string; openalex_institution_id: string; name: string; faculty_directory_url: string | null; website_url: string | null }[]>`
      select id, openalex_institution_id, name, faculty_directory_url, website_url
      from public.universities
      where active = true and openalex_institution_id is not null
    `;
    universities.sort((left, right) => {
      const leftPriority = prioritizedUniversityNames.has(left.name) ? 0 : 1;
      const rightPriority = prioritizedUniversityNames.has(right.name) ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.name.localeCompare(right.name);
    });
    const cachedSources = await sql<{ university_id: string; field: string; source_url: string; page_kind: string; confidence: string }[]>`
      select university_id, field, source_url, page_kind, confidence::text
      from public.university_faculty_sources
    `;
    const cachedSourceMap = new Map(
      cachedSources
        .filter((entry) => cachableFacultyPageKinds.has(entry.page_kind) && Number(entry.confidence) >= 0.72)
        .map((entry) => [`${entry.university_id}::${entry.field}`, entry]),
    );
    const processedAuthorIds = new Set<string>();
    const counters = {
      universitiesProcessed: universities.length,
      authorsFetched: 0,
      skippedDuplicate: 0,
      skippedNoAffiliation: 0,
      skippedNotEducationAffiliation: 0,
      skippedNoTitle: 0,
      skippedNotProfessor: 0,
      skippedMissingName: 0,
      skippedMissingKeyword: 0,
      skippedWeakUniversityMatch: 0,
      skippedLowFallbackConfidence: 0,
      savedVerifiedFaculty: 0,
      savedFallbackCandidates: 0,
      saved: 0,
    };
    const coverage = {
      candidateFacultyPagesFound: 0,
      highConfidenceDepartmentPagesFound: 0,
      verifiedRowsByUniversity: new Map<string, number>(),
      verifiedRowsByPageKind: new Map<string, number>(),
    };
    const seenCoverageKeys = new Set<string>();

    for (const university of universities) {
      for (const field of trackedFields) {
        const cachedSource = cachedSourceMap.get(`${university.id}::${field}`);
        const seededSource = getSeededFacultySource(university.name, field);
        const preferredFacultySourceUrl = seededSource?.url
          ?? cachedSource?.source_url
          ?? university.faculty_directory_url;
        const primaryKeyword = fieldKeywords(field)[0] ?? field;
        const works = await this.openAlex.getInstitutionWorks(university.openalex_institution_id, primaryKeyword, limitPerField);

        for (const work of works) {
          for (const authorship of work.authorships ?? []) {
            if (!authorship.author?.id) {
              continue;
            }
            if (processedAuthorIds.has(authorship.author.id)) {
              counters.skippedDuplicate += 1;
              continue;
            }
            processedAuthorIds.add(authorship.author.id);
            counters.authorsFetched += 1;

            const author = await this.openAlex.getAuthor(authorship.author.id);
            const affiliation = author.last_known_institutions?.find(
              (institution) => institution.id === university.openalex_institution_id,
            );
            if (!affiliation?.display_name) {
              counters.skippedNoAffiliation += 1;
              continue;
            }
            if (!isEducationInstitution(affiliation.type)) {
              counters.skippedNotEducationAffiliation += 1;
              continue;
            }

            const authorWorks = await this.openAlex.getAuthorWorks(authorship.author.id, 6);
            const summaries = summarizeWorks(authorWorks);
            const keywords = getKeywordList(summaries.keywordsText);
            const enrichment = await enrichFromFacultyDirectory({
              directoryUrl: preferredFacultySourceUrl,
              websiteUrl: university.website_url,
              field,
              researcherName: author.display_name,
            });
            const coverageKey = `${university.id}::${field}`;
            if (!seenCoverageKeys.has(coverageKey) && enrichment.directoryUrl) {
              seenCoverageKeys.add(coverageKey);
              coverage.candidateFacultyPagesFound += 1;
              if (enrichment.isHighConfidence && enrichment.pageKind === "department_faculty") {
                coverage.highConfidenceDepartmentPagesFound += 1;
              }
            }
            const shouldCachePreferredSource = Boolean(
              enrichment.directoryUrl
              && enrichment.isHighConfidence
              && cachableFacultyPageKinds.has(enrichment.pageKind),
            );

            if (shouldCachePreferredSource && enrichment.directoryUrl) {
              university.faculty_directory_url = enrichment.directoryUrl;
              await sql`
                update public.universities
                set faculty_directory_url = ${enrichment.directoryUrl}
                where id = ${university.id}
              `;
              await sql`
                insert into public.university_faculty_sources (
                  university_id,
                  field,
                  source_url,
                  page_kind,
                  confidence,
                  metadata_json,
                  last_verified_at
                )
                values (
                  ${university.id},
                  ${field},
                  ${enrichment.directoryUrl},
                  ${enrichment.pageKind},
                  ${enrichment.confidence},
                  ${JSON.stringify({
                    candidatePagesFound: enrichment.candidatePagesFound,
                    isHighConfidence: enrichment.isHighConfidence,
                    seededPreferredSource: seededSource?.url ?? null,
                  })}::jsonb,
                  timezone('utc', now())
                )
                on conflict (university_id, field) do update set
                  source_url = excluded.source_url,
                  page_kind = excluded.page_kind,
                  confidence = excluded.confidence,
                  metadata_json = excluded.metadata_json,
                  last_verified_at = excluded.last_verified_at,
                  updated_at = timezone('utc', now())
              `;
            }
            if (!author.display_name?.trim()) {
              counters.skippedMissingName += 1;
              continue;
            }
            if (!keywords.length) {
              counters.skippedMissingKeyword += 1;
              continue;
            }

            let source: "faculty_page" | "openalex" = "faculty_page";
            let sourceConfidence = Math.max(enrichment.confidence, 0.72);
            const normalizedTitle = normalizeResearcherTitle(enrichment.title);
            let verifiedFaculty = false;
            let storedTitle: string | null = null;
            let storedTitleNormalized: string | null = null;
            let isProfessor = false;
            let isAssistantProfessor = false;
            let inferredTitle: string | null = null;
            let inferredTitleConfidence: number | null = null;
            let trustedTitleSourceUrl: string | null = null;

            const canTrustFacultyPage = enrichment.isHighConfidence
              && enrichment.pageKind !== "directory"
              && normalizedTitle.normalizedTitle
              && normalizedTitle.isProfessor;

            if (canTrustFacultyPage) {
              verifiedFaculty = true;
              storedTitle = normalizedTitle.normalizedTitle;
              storedTitleNormalized = normalizedTitle.normalizedTitle;
              isProfessor = normalizedTitle.isProfessor;
              isAssistantProfessor = normalizedTitle.isAssistantProfessor;
              trustedTitleSourceUrl = enrichment.facultyPageUrl ?? enrichment.directoryUrl;
            } else {
              if (!hasTrustedFallbackUniversityMatch(author, university.openalex_institution_id)) {
                counters.skippedWeakUniversityMatch += 1;
                continue;
              }

              const missingTitle = !enrichment.title;
              const notProfessor = Boolean(enrichment.title) && !normalizedTitle.isProfessor;

              const fallbackScore = estimateProfessorLikelihood({
                author,
                authorWorks,
                keywordCount: keywords.length,
                facultySignalStrength: enrichment.pageKind === "department_faculty"
                  ? 0.08
                  : enrichment.pageKind === "generic_faculty"
                    ? 0.04
                    : 0.01,
              });

              if (fallbackScore < 0.62) {
                if (missingTitle) {
                  counters.skippedNoTitle += 1;
                } else if (notProfessor) {
                  counters.skippedNotProfessor += 1;
                }
                counters.skippedLowFallbackConfidence += 1;
                continue;
              }

              source = "openalex";
              sourceConfidence = fallbackScore;
              inferredTitle = normalizedTitle.normalizedTitle ?? "Professor";
              inferredTitleConfidence = fallbackScore;
            }

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
