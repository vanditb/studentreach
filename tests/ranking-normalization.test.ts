import { describe, expect, it } from "vitest";
import { extractKeywords, normalizeAcademicTitle, normalizeName } from "@/server/ranking/normalization";

describe("ranking normalization", () => {
  it("normalizes assistant professor titles", () => {
    expect(normalizeAcademicTitle("Assistant Professor of Computer Science")).toEqual({
      normalizedTitle: "Assistant Professor",
      isProfessor: true,
      isAssistantProfessor: true,
    });
  });

  it("normalizes names to a search-safe form", () => {
    expect(normalizeName("Dr. Maya Raman, PhD")).toBe("dr maya raman phd");
  });

  it("extracts weighted keywords from text", () => {
    expect(extractKeywords("Machine learning systems for health imaging and robust evaluation")).toContain("machine");
    expect(extractKeywords("Machine learning systems for health imaging and robust evaluation")).toContain("health");
  });
});
