import { normalizeAcademicTitle } from "@/server/ranking/normalization";

type FacultyEnrichmentResult = {
  title: string | null;
  facultyPageUrl: string | null;
  publicEmail: string | null;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function enrichFromFacultyDirectory({
  directoryUrl,
  researcherName,
}: {
  directoryUrl: string | null | undefined;
  researcherName: string;
}): Promise<FacultyEnrichmentResult> {
  if (!directoryUrl) {
    return {
      title: null,
      facultyPageUrl: null,
      publicEmail: null,
    };
  }

  try {
    const response = await fetch(directoryUrl, {
      headers: {
        "User-Agent": "studentreach-ingestion/0.1",
      },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) {
      return { title: null, facultyPageUrl: null, publicEmail: null };
    }

    const html = await response.text();
    const namePattern = new RegExp(escapeRegExp(researcherName), "i");
    const matchIndex = html.search(namePattern);
    if (matchIndex < 0) {
      return { title: null, facultyPageUrl: null, publicEmail: null };
    }

    const snippet = html.slice(Math.max(0, matchIndex - 600), Math.min(html.length, matchIndex + 800));
    const emailMatch = snippet.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const hrefMatch = snippet.match(/href=["']([^"']+)["']/i);
    const titleHint = snippet.match(/(assistant professor|associate professor|professor)/i)?.[1] ?? null;
    const normalized = normalizeAcademicTitle(titleHint);

    return {
      title: normalized.normalizedTitle,
      facultyPageUrl: hrefMatch?.[1] ?? null,
      publicEmail: emailMatch?.[0] ?? null,
    };
  } catch {
    return {
      title: null,
      facultyPageUrl: null,
      publicEmail: null,
    };
  }
}
