export function normalizeAcademicTitle(title: string | null | undefined) {
  const normalized = (title ?? "").trim().toLowerCase();

  if (!normalized) {
    return {
      normalizedTitle: null,
      isProfessor: false,
      isAssistantProfessor: false,
    };
  }

  if (normalized.includes("assistant professor")) {
    return {
      normalizedTitle: "Assistant Professor",
      isProfessor: true,
      isAssistantProfessor: true,
    };
  }

  if (normalized.includes("associate professor")) {
    return {
      normalizedTitle: "Associate Professor",
      isProfessor: true,
      isAssistantProfessor: false,
    };
  }

  if (normalized.includes("professor")) {
    return {
      normalizedTitle: "Professor",
      isProfessor: true,
      isAssistantProfessor: false,
    };
  }

  return {
    normalizedTitle: null,
    isProfessor: false,
    isAssistantProfessor: false,
  };
}

export function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function extractKeywords(input: string, limit = 8) {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "from",
    "into",
    "their",
    "using",
    "study",
    "research",
    "work",
  ]);

  return [...new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !stopwords.has(token)),
  )].slice(0, limit);
}
