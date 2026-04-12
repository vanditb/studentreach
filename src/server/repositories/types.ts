import {
  type DraftAnalysis,
  type DraftGenerationInput,
  type OnboardingState,
  type OutreachDraft,
  type Professor,
  type SearchParams,
  type SearchResponse,
  type StudentProfile,
} from "@/types";

export type SearchRecord = SearchResponse;

export type StudentReachRepository = {
  searchResearchers(params: SearchParams & { page?: number; pageSize?: number }): Promise<SearchResponse>;
  getResearcher(id: string): Promise<Professor | null>;
  getResearcherPublications(id: string): Promise<Professor["recentPapers"]>;
  getResearcherBreakdown(id: string): Promise<{
    workSummary: string;
    researchBreakdown: Professor["researchBreakdown"];
    whyFit: string;
    currentFocus: string;
    goodTalkingPoints: string[];
    recentPapers: Professor["recentPapers"];
  } | null>;
  getStudentProfile(userId: string): Promise<StudentProfile>;
  saveStudentProfile(userId: string, profile: StudentProfile): Promise<StudentProfile>;
  getOnboarding(userId: string): Promise<OnboardingState>;
  saveOnboarding(userId: string, state: OnboardingState): Promise<OnboardingState>;
  listSavedResearchers(userId: string): Promise<string[]>;
  toggleSavedResearcher(userId: string, researcherId: string): Promise<string[]>;
  listDrafts(userId: string): Promise<OutreachDraft[]>;
  getDraft(userId: string, draftId: string): Promise<OutreachDraft | null>;
  saveDraft(userId: string, draft: OutreachDraft): Promise<OutreachDraft>;
  getUniversities(): Promise<string[]>;
  getCachedGeneration<T>(cacheKey: string): Promise<T | null>;
  setCachedGeneration<T>(cacheKey: string, value: T): Promise<void>;
  logSearchEvent(input: {
    userId?: string | null;
    queryText?: string;
    locationText?: string;
    locationLat?: number | null;
    locationLon?: number | null;
    radiusMiles?: number;
    fieldFilter?: string | null;
    universityFilter?: string | null;
    resultsCount: number;
  }): Promise<void>;
  createDraftFromGeneration(userId: string, draft: Omit<OutreachDraft, "id" | "updatedAt">): Promise<OutreachDraft>;
  saveDraftFeedback(userId: string, draftId: string, analysis: DraftAnalysis): Promise<OutreachDraft | null>;
  getGenerationContext(args: DraftGenerationInput & { userId?: string | null }): Promise<{
    professor: Professor;
    profile: StudentProfile | null;
  }>;
};
