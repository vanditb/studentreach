import { describe, expect, it } from "vitest";
import { summarizeCurrentFocus, summarizeWorks } from "@/server/ingestion/normalize";
import { type OpenAlexWork } from "@/server/ingestion/openalex-client";
import { extractKeywords, normalizeAcademicTitle } from "@/server/ranking/normalization";
import { classifyCandidateUrl, scoreDirectoryPage } from "@/server/ingestion/faculty-enrichment";

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

  it("normalizes professor-like titles correctly", () => {
    expect(normalizeAcademicTitle("Assistant Professor of Biology")).toMatchObject({
      normalizedTitle: "Assistant Professor",
      isProfessor: true,
      isAssistantProfessor: true,
    });
    expect(normalizeAcademicTitle("Postdoctoral Researcher")).toMatchObject({
      normalizedTitle: null,
      isProfessor: false,
      isAssistantProfessor: false,
    });
  });

  it("removes generic ingestion keywords", () => {
    const keywords = extractKeywords("analysis method study robust protein signals learning", 6);
    expect(keywords).toContain("robust");
    expect(keywords).toContain("protein");
    expect(keywords).not.toContain("analysis");
    expect(keywords).not.toContain("method");
    expect(keywords).not.toContain("study");
  });

  it("prefers department faculty URLs over generic directories", () => {
    expect(classifyCandidateUrl("https://www.example.edu/computer-science/faculty")).toBe("department_faculty");
    expect(classifyCandidateUrl("https://www.example.edu/directory")).toBe("directory");
  });

  it("treats department faculty listings as higher confidence than generic directories", () => {
    const departmentListing = `
      <html><body>
        <h1>Computer Science Faculty</h1>
        <div>Assistant Professor Jane Doe <a href="/people/jane">Profile</a> <a href="mailto:jane@example.edu">Email</a></div>
        <div>Professor John Smith <a href="/people/john">Profile</a> <a href="mailto:john@example.edu">Email</a></div>
      </body></html>
    `;
    const genericDirectory = `
      <html><body>
        <h1>Campus Directory</h1>
        <div>Search people, offices, and phone numbers across campus.</div>
        <div>Professor Jane Doe</div>
      </body></html>
    `;

    const departmentScore = scoreDirectoryPage(departmentListing, "https://www.example.edu/computer-science/faculty", "Computer Science / AI");
    const directoryScore = scoreDirectoryPage(genericDirectory, "https://www.example.edu/directory", "Computer Science / AI");

    expect(departmentScore.isHighConfidence).toBe(true);
    expect(directoryScore.isHighConfidence).toBe(false);
    expect(departmentScore.confidence).toBeGreaterThan(directoryScore.confidence);
  });

  it("heavily penalizes broad academic hub pages", () => {
    const genericHub = `
      <html><body>
        <h1>Graduate & Professional Study</h1>
        <p>Explore academics, admissions, and schools across the university.</p>
        <a href="/academics">Academics</a>
        <a href="/schools">Schools</a>
      </body></html>
    `;

    const hubScore = scoreDirectoryPage(
      genericHub,
      "https://www.example.edu/graduate-professional-study",
      "Computer Science / AI",
    );

    expect(hubScore.isHighConfidence).toBe(false);
    expect(hubScore.confidence).toBeLessThan(0.25);
  });
});
