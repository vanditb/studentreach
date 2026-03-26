import { normalizeAcademicTitle, normalizeName } from "@/server/ranking/normalization";
import { type Field } from "@/types";

export type FacultyPageKind =
  | "department_faculty"
  | "department_directory"
  | "subschool_faculty"
  | "generic_faculty"
  | "directory"
  | "unknown";

export type FacultyEnrichmentResult = {
  title: string | null;
  facultyPageUrl: string | null;
  publicEmail: string | null;
  directoryUrl: string | null;
  department: string | null;
  bioSnippet: string | null;
  pageKind: FacultyPageKind;
  confidence: number;
  isHighConfidence: boolean;
  candidatePagesFound: number;
};

type DiscoveryResult = {
  url: string | null;
  html: string | null;
  pageKind: FacultyPageKind;
  confidence: number;
  isHighConfidence: boolean;
  candidatePagesFound: number;
};

const directoryCache = new Map<string, Promise<DiscoveryResult>>();
const htmlCache = new Map<string, Promise<string | null>>();

const genericHubPathPatterns = [
  /\/academics\/?$/i,
  /\/graduate-professional-study\/?$/i,
  /\/schools\/?$/i,
  /\/schools-and-colleges\/?$/i,
  /\/admissions\/?$/i,
];

const genericDirectoryPathPatterns = [
  /\/directory\/?$/i,
  /\/directory\/search/i,
  /\/people\/?$/i,
  /\/people\/search/i,
  /\/search\/?$/i,
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldDiscoveryConfig(field: Field) {
  switch (field) {
    case "Computer Science / AI":
      return {
        pathTokens: [
          "computer-science",
          "cs",
          "computing",
          "computer_science",
          "artificial-intelligence",
          "ai",
          "machine-learning",
          "data-science",
          "statistics",
          "statistical-science",
        ],
        textTokens: ["computer science", "ai", "artificial intelligence", "machine learning", "data science", "statistics"],
      };
    case "Biology / Biotech":
      return {
        pathTokens: ["biology", "biological-sciences", "biotech", "biochemistry", "molecular-biology", "genetics"],
        textTokens: ["biology", "biological sciences", "biotechnology", "biochemistry", "genetics"],
      };
    case "Physics":
      return {
        pathTokens: ["physics", "astronomy", "applied-physics"],
        textTokens: ["physics", "astronomy", "applied physics"],
      };
    case "Engineering":
      return {
        pathTokens: [
          "engineering",
          "electrical-engineering",
          "computer-engineering",
          "ece",
          "mechanical-engineering",
          "bioengineering",
          "biomedical-engineering",
        ],
        textTokens: [
          "engineering",
          "electrical engineering",
          "computer engineering",
          "ece",
          "biomedical engineering",
          "bioengineering",
        ],
      };
    case "Psychology / Neuroscience":
      return {
        pathTokens: ["psychology", "neuroscience", "brain-sciences", "cognitive-science", "mind-brain"],
        textTokens: ["psychology", "neuroscience", "brain sciences", "cognitive science"],
      };
    case "Economics / Social Science":
      return {
        pathTokens: ["economics", "economy", "social-science", "public-policy", "policy"],
        textTokens: ["economics", "public policy", "social science"],
      };
    case "Chemistry":
      return {
        pathTokens: ["chemistry", "chemical-engineering", "chemical-biology", "chem"],
        textTokens: ["chemistry", "chemical engineering", "chemical biology"],
      };
    default:
      return { pathTokens: [], textTokens: [] };
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function baseDomain(hostname: string) {
  const parts = hostname.split(".").filter(Boolean);
  return parts.slice(-2).join(".");
}

function sameSiteUrl(baseUrl: string, href: string) {
  try {
    const resolved = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    const resolvedDomain = baseDomain(resolved.hostname);
    const baseSite = baseDomain(base.hostname);
    if (
      resolvedDomain !== baseSite
      && !resolved.hostname.endsWith(`.${baseSite}`)
      && !base.hostname.endsWith(`.${resolvedDomain}`)
    ) {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

function buildDiscoverySeedUrls(websiteUrl: string, field: Field) {
  const base = new URL(websiteUrl);
  const { pathTokens } = fieldDiscoveryConfig(field);
  const genericSeeds = [
    "/academics",
    "/departments",
    "/academics/departments",
    "/schools",
    "/schools-and-colleges",
    "/research",
    "/programs",
  ];
  const fieldSeeds = pathTokens.flatMap((token) => [
    `/academics/${token}`,
    `/departments/${token}`,
    `/${token}`,
  ]);

  return [...new Set([websiteUrl, ...genericSeeds, ...fieldSeeds].map((value) => new URL(value, base).toString()))];
}

function classifyCandidateUrl(candidateUrl: string) {
  const parsed = new URL(candidateUrl);
  const pathname = parsed.pathname.toLowerCase();
  const urlContext = `${parsed.hostname.toLowerCase()} ${pathname}`;
  const departmentSignals = /(computer-science|computing|biology|biological|physics|astronomy|engineering|electrical|computer-engineering|data-science|statistics|biomedical|psychology|neuroscience|economics|chemistry|departments|school-of|college-of|department|cpsc|csci|\bcs\b|\bece\b)/.test(urlContext);
  const facultySignals = /(faculty|our-faculty|faculty-and-staff)/.test(pathname);
  const peopleSignals = /(people|directory)/.test(pathname);
  const directorySignals = pathname.includes("/directory");
  const subschoolSignals = /(school|college|institute)/.test(pathname);
  const genericHubSignals = genericHubPathPatterns.some((pattern) => pattern.test(pathname));
  const genericDirectorySignals = genericDirectoryPathPatterns.some((pattern) => pattern.test(pathname));

  if (departmentSignals && facultySignals) {
    return "department_faculty" as const;
  }
  if (departmentSignals && peopleSignals) {
    return "department_directory" as const;
  }
  if (subschoolSignals && facultySignals) {
    return "subschool_faculty" as const;
  }
  if (genericHubSignals) {
    return "unknown" as const;
  }
  if (facultySignals || pathname.includes("/people")) {
    return "generic_faculty" as const;
  }
  if (directorySignals || genericDirectorySignals) {
    return "directory" as const;
  }
  return "unknown" as const;
}

function buildBaseCandidateUrls(websiteUrl: string, field: Field, existingDirectoryUrl?: string | null) {
  const base = new URL(websiteUrl);
  const { pathTokens } = fieldDiscoveryConfig(field);
  const genericPaths = ["/faculty", "/people", "/directory", "/faculty-and-staff", "/our-faculty"];
  const fieldPaths = pathTokens.flatMap((prefix) => [
    `/${prefix}/faculty`,
    `/${prefix}/people`,
    `/${prefix}/directory`,
    `/${prefix}/faculty-and-staff`,
    `/academics/${prefix}/faculty`,
    `/academics/${prefix}/people`,
    `/academics/${prefix}/faculty-and-staff`,
    `/departments/${prefix}/faculty`,
    `/departments/${prefix}/people`,
    `/departments/${prefix}/faculty-and-staff`,
    `/department/${prefix}/faculty`,
    `/school-of-${prefix}/faculty`,
  ]);

  return [...new Set(
    [existingDirectoryUrl ?? null, ...fieldPaths, ...genericPaths]
      .filter(Boolean)
      .map((value) => new URL(value!, base).toString()),
  )];
}

function scoreCandidateLink(url: string, linkText: string, field: Field) {
  const pathname = new URL(url).pathname.toLowerCase();
  const text = `${pathname} ${linkText.toLowerCase()}`;
  const { pathTokens, textTokens } = fieldDiscoveryConfig(field);
  const hasPreferredAnchor = /(faculty|our faculty|faculty and staff|faculty-and-staff|our-faculty|people|directory)/.test(text);
  const hasFaculty = /(faculty|our faculty|faculty and staff)/.test(text);
  const hasPeople = /(people|directory)/.test(text);
  const fieldHits = [...pathTokens, ...textTokens].filter((token) => text.includes(token)).length;
  const departmentHits = /(department|school|college|program|division)/.test(text) ? 1 : 0;
  const genericDirectoryHits = /(campus directory|staff directory|search people|phonebook|contact directory|search directory|employee directory)/.test(text) ? 1 : 0;
  const genericHubHits = /(academics|graduate professional study|schools|admissions)/.test(text) ? 1 : 0;
  const genericPathPenalty = [...genericHubPathPatterns, ...genericDirectoryPathPatterns].some((pattern) => pattern.test(pathname)) ? 1 : 0;
  const departmentFieldCombo = departmentHits && fieldHits > 0 ? 1 : 0;

  return (hasPreferredAnchor ? 4 : -2)
    + (hasFaculty ? 12 : 0)
    + (hasPeople ? 6 : 0)
    + fieldHits * 7
    + departmentHits * 5
    + departmentFieldCombo * 8
    - genericDirectoryHits * 10
    - genericHubHits * 14
    - genericPathPenalty * 16;
}

function extractCandidateLinks(baseUrl: string, html: string, field: Field) {
  const matches = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const ranked = matches
    .map((match) => {
      const url = sameSiteUrl(baseUrl, match[1]);
      if (!url) {
        return null;
      }
      const linkText = stripHtml(match[2]);
      const score = scoreCandidateLink(url, linkText, field);
      if (score <= 0) {
        return null;
      }
      return { url, score };
    })
    .filter(Boolean) as Array<{ url: string; score: number }>;

  const derived = ranked.flatMap(({ url }) => {
    const derivedCandidates = [url];
    if (!/(faculty|people|directory|staff)/.test(url.toLowerCase())) {
      derivedCandidates.push(`${url.replace(/\/$/, "")}/faculty`);
      derivedCandidates.push(`${url.replace(/\/$/, "")}/people`);
      derivedCandidates.push(`${url.replace(/\/$/, "")}/faculty-and-staff`);
    }
    return derivedCandidates;
  });

  return [...new Set(derived)].slice(0, 18);
}

function scoreDirectoryPage(html: string, candidateUrl: string, field: Field) {
  const text = stripHtml(html).toLowerCase();
  const { pathTokens, textTokens } = fieldDiscoveryConfig(field);
  const professorMatches = (text.match(/\b(assistant professor|associate professor|professor)\b/g) ?? []).length;
  const facultyMentions = (text.match(/\bfaculty\b/g) ?? []).length;
  const directoryMentions = (text.match(/\b(directory|people|staff)\b/g) ?? []).length;
  const departmentMentions = (text.match(/\b(department|school|college|program|division|lab|research group)\b/g) ?? []).length;
  const genericSearchMentions = (text.match(/\b(search|lookup|phonebook|campus directory|contact us|staff directory)\b/g) ?? []).length;
  const profileLinkMatches = (html.match(/href=/gi) ?? []).length;
  const mailtoMatches = (html.match(/mailto:/gi) ?? []).length;
  const fieldContextHits = [...pathTokens, ...textTokens].filter((token) => text.includes(token)).length;
  const kind = classifyCandidateUrl(candidateUrl);
  const pathname = new URL(candidateUrl).pathname.toLowerCase();
  const genericHubPenalty = genericHubPathPatterns.some((pattern) => pattern.test(pathname)) ? 1 : 0;
  const genericDirectoryPenalty = genericDirectoryPathPatterns.some((pattern) => pattern.test(pathname)) ? 1 : 0;
  const multipleTitlePatterns = professorMatches >= 2;

  const kindBonus = kind === "department_faculty"
    ? 28
    : kind === "department_directory"
      ? 16
      : kind === "subschool_faculty"
        ? 14
        : kind === "generic_faculty"
          ? 8
          : kind === "directory"
            ? -12
            : 0;

  const score = professorMatches * 8
    + facultyMentions * 5
    + Math.min(profileLinkMatches, 20)
    + Math.min(mailtoMatches, 8) * 2
    + departmentMentions * 4
    + fieldContextHits * 4
    + kindBonus
    - directoryMentions
    - genericSearchMentions * 5
    - genericHubPenalty * 24
    - genericDirectoryPenalty * 18;

  const confidence = Math.max(0, Math.min(0.99, (
    (kind === "department_faculty" ? 0.52 : kind === "department_directory" ? 0.38 : kind === "subschool_faculty" ? 0.34 : kind === "generic_faculty" ? 0.24 : kind === "directory" ? 0.05 : 0.1)
    + Math.min(professorMatches, 10) * 0.04
    + Math.min(facultyMentions, 6) * 0.03
    + Math.min(fieldContextHits, 6) * 0.025
    + Math.min(mailtoMatches, 6) * 0.015
    - Math.min(genericSearchMentions, 5) * 0.04
    - genericHubPenalty * 0.22
    - genericDirectoryPenalty * 0.14
  )));

  const isHighConfidence = (
    (kind === "department_faculty" || kind === "department_directory" || kind === "subschool_faculty")
    && multipleTitlePatterns
    && fieldContextHits >= 1
    && facultyMentions >= 1
    && confidence >= 0.72
    && genericHubPenalty === 0
    && genericDirectoryPenalty === 0
  );

  return {
    score,
    kind,
    confidence: Number(confidence.toFixed(4)),
    isHighConfidence,
  };
}

async function fetchHtml(url: string) {
  const cached = htmlCache.get(url);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "studentreach-ingestion/0.1",
        },
        next: { revalidate: 60 * 60 * 24 },
      });

      if (!response.ok) {
        return null;
      }

      return response.text();
    } catch {
      return null;
    }
  })();

  htmlCache.set(url, request);
  return request;
}

async function discoverFacultyDirectory({
  websiteUrl,
  field,
  existingDirectoryUrl,
}: {
  websiteUrl: string | null | undefined;
  field: Field;
  existingDirectoryUrl?: string | null;
}) {
  if (!websiteUrl) {
    return {
      url: null,
      html: null,
      pageKind: "unknown" as const,
      confidence: 0,
      isHighConfidence: false,
      candidatePagesFound: 0,
    };
  }

  const cacheKey = `${websiteUrl}::${field}::${existingDirectoryUrl ?? ""}`;
  const cached = directoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const candidates = new Set<string>(buildBaseCandidateUrls(websiteUrl, field, existingDirectoryUrl));
    for (const seedUrl of buildDiscoverySeedUrls(websiteUrl, field)) {
      const seedHtml = await fetchHtml(seedUrl);
      if (!seedHtml) {
        continue;
      }
      for (const discovered of extractCandidateLinks(seedUrl, seedHtml, field)) {
        candidates.add(discovered);
      }
    }

    let candidatePagesFound = 0;
    let best: DiscoveryResult & { score: number } = {
      url: null,
      html: null,
      pageKind: "unknown",
      confidence: 0,
      isHighConfidence: false,
      candidatePagesFound: 0,
      score: -1,
    };

    for (const candidate of candidates) {
      const html = await fetchHtml(candidate);
      if (!html) {
        continue;
      }

      candidatePagesFound += 1;
      const scored = scoreDirectoryPage(html, candidate, field);
      if (scored.score > best.score) {
        best = {
          url: candidate,
          html,
          pageKind: scored.kind,
          confidence: scored.confidence,
          isHighConfidence: scored.isHighConfidence,
          candidatePagesFound,
          score: scored.score,
        };
      }
    }

    return {
      url: best.url,
      html: best.html,
      pageKind: best.pageKind,
      confidence: best.confidence,
      isHighConfidence: best.isHighConfidence,
      candidatePagesFound,
    };
  })();

  directoryCache.set(cacheKey, request);
  return request;
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string | null | undefined) {
  if (!maybeRelative) {
    return null;
  }

  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractProfileBlocks(html: string, researcherName: string) {
  const normalizedName = normalizeName(researcherName);
  const needles = [...new Set([
    researcherName,
    researcherName.trim().split(/\s+/).slice(-2).join(" "),
    researcherName.trim().split(/\s+/).at(-1) ?? "",
  ].filter((value) => value.length >= 3))];

  const blocks = new Set<string>();
  const enclosingTags = ["article", "li", "tr", "section", "div"];

  for (const needle of needles) {
    const escaped = escapeRegExp(needle);
    for (const tag of enclosingTags) {
      const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]{0,2200}?${escaped}[\\s\\S]{0,2200}?<\\/${tag}>`, "ig");
      for (const match of html.matchAll(pattern)) {
        const snippet = match[0];
        if (normalizeName(stripHtml(snippet)).includes(normalizedName)) {
          blocks.add(snippet);
        }
      }
    }
  }

  for (const snippet of extractNameSnippets(html, researcherName)) {
    blocks.add(snippet);
  }

  return [...blocks];
}

function extractNameSnippets(html: string, researcherName: string) {
  const normalizedName = normalizeName(researcherName);
  const nameParts = researcherName.trim().split(/\s+/).filter(Boolean);
  const likelyNeedles = [...new Set([
    researcherName,
    nameParts.at(-1) ?? "",
    nameParts.slice(-2).join(" "),
  ].filter((value) => value.length >= 3))];

  const snippets: string[] = [];
  for (const needle of likelyNeedles) {
    const pattern = new RegExp(escapeRegExp(needle), "ig");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const snippet = html.slice(Math.max(0, match.index - 900), Math.min(html.length, match.index + 1500));
      if (normalizeName(stripHtml(snippet)).includes(normalizedName)) {
        snippets.push(snippet);
      }
    }
  }

  return snippets;
}

function extractDepartment(textSnippet: string, field: Field) {
  const directMatch = textSnippet.match(/\b((department|school|college|program|division) of [A-Za-z&,\- ]{3,80})\b/i)?.[1];
  if (directMatch) {
    return directMatch.replace(/\s+/g, " ").trim();
  }

  const { textTokens } = fieldDiscoveryConfig(field);
  const matchedToken = textTokens.find((token) => textSnippet.toLowerCase().includes(token));
  if (matchedToken) {
    return matchedToken
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return null;
}

function extractBioSnippet(textSnippet: string, researcherName: string, title: string | null) {
  let cleaned = textSnippet
    .replace(new RegExp(escapeRegExp(researcherName), "ig"), " ")
    .replace(/\b(assistant professor|associate professor|professor)\b/ig, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (title) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(title), "ig"), " ").replace(/\s+/g, " ").trim();
  }

  const words = cleaned.split(" ").filter(Boolean);
  if (words.length < 10) {
    return null;
  }

  return words.slice(0, 32).join(" ");
}

export async function enrichFromFacultyDirectory({
  directoryUrl,
  websiteUrl,
  field,
  researcherName,
}: {
  directoryUrl: string | null | undefined;
  websiteUrl: string | null | undefined;
  field: Field;
  researcherName: string;
}): Promise<FacultyEnrichmentResult> {
  const discovered = await discoverFacultyDirectory({
    websiteUrl,
    field,
    existingDirectoryUrl: directoryUrl,
  });

  if (!discovered.url || !discovered.html) {
    return {
      title: null,
      facultyPageUrl: null,
      publicEmail: null,
      directoryUrl: null,
      department: null,
      bioSnippet: null,
      pageKind: "unknown",
      confidence: 0,
      isHighConfidence: false,
      candidatePagesFound: discovered.candidatePagesFound,
    };
  }

  const normalizedName = normalizeName(researcherName);
  const blocks = extractProfileBlocks(discovered.html, researcherName);
  if (!blocks.length) {
    return {
      title: null,
      facultyPageUrl: null,
      publicEmail: null,
      directoryUrl: discovered.url,
      department: null,
      bioSnippet: null,
      pageKind: discovered.pageKind,
      confidence: discovered.confidence,
      isHighConfidence: discovered.isHighConfidence,
      candidatePagesFound: discovered.candidatePagesFound,
    };
  }

  let bestMatch: FacultyEnrichmentResult | null = null;
  let bestScore = -1;

  for (const block of blocks) {
    const textSnippet = stripHtml(block);
    if (!normalizeName(textSnippet).includes(normalizedName)) {
      continue;
    }

    const titleHint = textSnippet.match(/\b(assistant professor|associate professor|professor)\b/i)?.[1] ?? null;
    const normalized = normalizeAcademicTitle(titleHint);
    const emailMatch = block.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const hrefMatch = block.match(/href=["']([^"']+)["']/i);
    const department = extractDepartment(textSnippet, field);
    const bioSnippet = extractBioSnippet(textSnippet, researcherName, normalized.normalizedTitle);

    const score = (normalized.normalizedTitle ? 10 : 0)
      + (emailMatch?.[0] ? 4 : 0)
      + (hrefMatch?.[1] ? 4 : 0)
      + (department ? 3 : 0)
      + (bioSnippet ? 2 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        title: normalized.normalizedTitle,
        facultyPageUrl: toAbsoluteUrl(discovered.url, hrefMatch?.[1]) ?? discovered.url,
        publicEmail: emailMatch?.[0] ?? null,
        directoryUrl: discovered.url,
        department,
        bioSnippet,
        pageKind: discovered.pageKind,
        confidence: discovered.confidence,
        isHighConfidence: discovered.isHighConfidence,
        candidatePagesFound: discovered.candidatePagesFound,
      };
    }
  }

  return bestMatch ?? {
    title: null,
    facultyPageUrl: null,
    publicEmail: null,
    directoryUrl: discovered.url,
    department: null,
    bioSnippet: null,
    pageKind: discovered.pageKind,
    confidence: discovered.confidence,
    isHighConfidence: discovered.isHighConfidence,
    candidatePagesFound: discovered.candidatePagesFound,
  };
}

export { classifyCandidateUrl, scoreDirectoryPage };
