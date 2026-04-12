import { FIELDS, type Field } from "@/types";

type FieldRule = {
  field: Field;
  keywords: string[];
};

const rules: FieldRule[] = [
  { field: "Computer Science / AI", keywords: ["machine learning", "ai", "artificial intelligence", "nlp", "computer vision", "robotics", "systems"] },
  { field: "Biology / Biotech", keywords: ["biology", "biotech", "genomics", "synthetic biology", "microbiome", "cell", "protein"] },
  { field: "Physics", keywords: ["physics", "quantum", "astrophysics", "optics", "plasma", "materials physics"] },
  { field: "Engineering", keywords: ["engineering", "embedded", "control", "autonomous", "device", "materials engineering", "optimization"] },
  { field: "Psychology / Neuroscience", keywords: ["psychology", "neuroscience", "memory", "cognition", "attention", "behavior", "brain"] },
  { field: "Economics / Social Science", keywords: ["economics", "behavioral economics", "policy", "inequality", "social science", "governance", "education policy"] },
  { field: "Chemistry", keywords: ["chemistry", "catalysis", "electrochemistry", "polymer", "materials chemistry", "chemical biology"] },
];

export function inferBroadField(query: string): Field | null {
  const normalized = query.toLowerCase();
  let best: { field: Field; score: number } | null = null;

  for (const rule of rules) {
    const score = rule.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);
    if (!best || score > best.score) {
      best = { field: rule.field, score };
    }
  }

  return best && best.score > 0 ? best.field : null;
}

export function fieldKeywords(field: Field | null | undefined) {
  return rules.find((rule) => rule.field === field)?.keywords ?? [];
}

export function normalizeFieldFilter(value: string | null | undefined): Field | "All" {
  if (!value || value === "All") {
    return "All";
  }

  return (FIELDS.find((field) => field === value) ?? inferBroadField(value) ?? "All") as Field | "All";
}
