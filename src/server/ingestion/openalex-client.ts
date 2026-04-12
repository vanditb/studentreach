import { setTimeout as delay } from "node:timers/promises";
import { getServerEnv } from "@/server/env";

const OPENALEX_API = "https://api.openalex.org";

type OpenAlexInstitution = {
  id: string;
  display_name: string;
  geo?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
  };
  homepage_url?: string;
};

type OpenAlexAuthor = {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  last_known_institutions?: Array<{ id: string; display_name: string }>;
  summary_stats?: {
    h_index?: number;
  };
};

type OpenAlexWork = {
  id: string;
  title: string;
  publication_year: number | null;
  doi: string | null;
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string | null } };
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: Array<{
    author: { id: string; display_name: string };
    institutions?: Array<{ id: string; display_name: string }>;
  }>;
  concepts?: Array<{ display_name: string; score: number }>;
};

type PaginatedResponse<T> = {
  results: T[];
  meta?: {
    next_cursor?: string | null;
  };
};

function buildHeaders() {
  const env = getServerEnv();
  return env.STUDENTREACH_OPENALEX_EMAIL
    ? {
        "User-Agent": `studentreach/0.1 (${env.STUDENTREACH_OPENALEX_EMAIL})`,
      }
    : undefined;
}

async function fetchOpenAlex<T>(path: string, attempt = 0): Promise<T> {
  const response = await fetch(`${OPENALEX_API}${path}`, {
    headers: buildHeaders(),
    next: { revalidate: 60 * 60 },
  });

  if (response.status === 429 && attempt < 3) {
    await delay(500 * (attempt + 1));
    return fetchOpenAlex<T>(path, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`OpenAlex request failed (${response.status}): ${path}`);
  }

  return response.json() as Promise<T>;
}

export function expandOpenAlexAbstract(index: Record<string, number[]> | null | undefined) {
  if (!index) {
    return null;
  }

  const words = Object.entries(index).flatMap(([word, positions]) =>
    positions.map((position) => ({ position, word })),
  );

  return words
    .sort((left, right) => left.position - right.position)
    .map((entry) => entry.word)
    .join(" ");
}

export class OpenAlexClient {
  async searchInstitutionByName(name: string) {
    const encoded = encodeURIComponent(name);
    const response = await fetchOpenAlex<PaginatedResponse<OpenAlexInstitution>>(
      `/institutions?search=${encoded}&filter=country_code:US&per-page=5`,
    );
    return response.results;
  }

  async getAuthor(authorId: string) {
    return fetchOpenAlex<OpenAlexAuthor>(`/authors/${encodeURIComponent(authorId)}`);
  }

  async getAuthorWorks(authorId: string, perPage = 8) {
    const response = await fetchOpenAlex<PaginatedResponse<OpenAlexWork>>(
      `/works?filter=author.id:${encodeURIComponent(authorId)}&sort=publication_year:desc&per-page=${perPage}`,
    );
    return response.results;
  }

  async getInstitutionWorks(institutionId: string, searchTerm: string, perPage = 25) {
    const encodedSearch = encodeURIComponent(searchTerm);
    const response = await fetchOpenAlex<PaginatedResponse<OpenAlexWork>>(
      `/works?filter=institutions.id:${encodeURIComponent(institutionId)},from_publication_date:2020-01-01&search=${encodedSearch}&per-page=${perPage}`,
    );
    return response.results;
  }
}

export type { OpenAlexAuthor, OpenAlexInstitution, OpenAlexWork };
