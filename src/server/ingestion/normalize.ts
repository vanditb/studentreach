import { extractKeywords, normalizeAcademicTitle, normalizeName } from "@/server/ranking/normalization";
import { expandOpenAlexAbstract, type OpenAlexWork } from "@/server/ingestion/openalex-client";
import { type Field } from "@/types";

export function summarizeCurrentFocus(works: OpenAlexWork[]) {
  const concepts = works.flatMap((work) => work.concepts?.slice(0, 3).map((concept) => concept.display_name) ?? []);
  const keywords = extractKeywords(concepts.join(" "), 5);
  return keywords.length
    ? `Recent work emphasizes ${keywords.join(", ")}.`
    : "Recent publications suggest an active and evolving research program.";
}

export function summarizeWorks(works: OpenAlexWork[]) {
  const abstracts = works
    .map((work) => expandOpenAlexAbstract(work.abstract_inverted_index))
    .filter(Boolean)
    .join(" ");
  const keywords = extractKeywords(abstracts, 8);
  return {
    bioSummary: keywords.length
      ? `Research themes consistently touch on ${keywords.slice(0, 4).join(", ")}.`
      : "Public research output is available, but a stable thematic summary has not been derived yet.",
    keywordsText: keywords.join(", "),
    pastThemes: keywords.slice(4),
  };
}

export function inferBroadFieldFromKeywords(keywordBlob: string, fallbackField: Field): Field {
  const normalized = keywordBlob.toLowerCase();
  if (normalized.includes("economics") || normalized.includes("policy") || normalized.includes("inequality")) {
    return "Economics / Social Science";
  }
  if (normalized.includes("brain") || normalized.includes("cognition") || normalized.includes("neural")) {
    return "Psychology / Neuroscience";
  }
  if (normalized.includes("cell") || normalized.includes("protein") || normalized.includes("genomic")) {
    return "Biology / Biotech";
  }
  if (normalized.includes("quantum") || normalized.includes("photon") || normalized.includes("plasma")) {
    return "Physics";
  }
  if (normalized.includes("catal") || normalized.includes("polymer") || normalized.includes("electrochem")) {
    return "Chemistry";
  }
  if (normalized.includes("system") || normalized.includes("device") || normalized.includes("optimization")) {
    return "Engineering";
  }
  if (normalized.includes("machine") || normalized.includes("vision") || normalized.includes("language")) {
    return "Computer Science / AI";
  }
  return fallbackField;
}

export function normalizeResearcherTitle(title: string | null | undefined) {
  return normalizeAcademicTitle(title);
}

export function normalizeResearcherName(name: string) {
  return normalizeName(name);
}
