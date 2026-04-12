import { describe, expect, it } from "vitest";
import { summarizeCurrentFocus, summarizeWorks } from "@/server/ingestion/normalize";
import { type OpenAlexWork } from "@/server/ingestion/openalex-client";

const works: OpenAlexWork[] = [
  {
    id: "https://openalex.org/W1",
    title: "Robust Modeling for Health Signals",
    publication_year: 2025,
    doi: null,
    abstract_inverted_index: {
      robust: [0],
      modeling: [1],
      health: [2],
      signals: [3],
    },
    concepts: [
      { display_name: "Machine learning", score: 0.9 },
      { display_name: "Health data", score: 0.8 },
    ],
  },
  {
    id: "https://openalex.org/W2",
    title: "Evaluation under shift",
    publication_year: 2024,
    doi: null,
    abstract_inverted_index: {
      evaluation: [0],
      under: [1],
      shift: [2],
    },
    concepts: [{ display_name: "Distribution shift", score: 0.91 }],
  },
];

describe("ingestion normalization", () => {
  it("builds summaries from OpenAlex works", () => {
    const result = summarizeWorks(works);
    expect(result.bioSummary).toContain("Research themes");
    expect(result.keywordsText).toContain("robust");
  });

  it("derives a current focus summary from concepts", () => {
    const result = summarizeCurrentFocus(works);
    expect(result).toContain("Recent work emphasizes");
  });
});
