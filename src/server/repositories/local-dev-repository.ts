import { defaultOnboarding, defaultProfile, seededDrafts } from "@/data/mock/profile";
import { mockProfessors, mockUniversities } from "@/data/mock/professors";
import { buildCacheKey } from "@/server/cache/keying";
import { geocodeLocation } from "@/server/search/geocode";
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
import { readLocalStore, writeLocalStore } from "./file-store";
import { type StudentReachRepository } from "./types";

function distanceMiles(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(latitudeB - latitudeA);
  const dLon = toRad(longitudeB - longitudeA);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitudeA)) *
      Math.cos(toRad(latitudeB)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function matchesTopic(professor: Professor, topic: string) {
  if (!topic.trim()) {
    return true;
  }

  const haystack = [
    professor.name,
    professor.university,
    professor.department,
    professor.field,
    professor.workSummary,
    professor.currentFocus,
    professor.whyFit,
    ...professor.researchTags,
  ]
    .join(" ")
    .toLowerCase();

  return topic
    .toLowerCase()
    .split(/\s+/)
    .every((token) => haystack.includes(token));
}

export class LocalDevRepository implements StudentReachRepository {
  async searchResearchers(params: SearchParams & { page?: number; pageSize?: number }): Promise<SearchResponse> {
    const origin = geocodeLocation(params.location);
    const results = mockProfessors.filter((professor) => {
      const fieldMatch = !params.field || params.field === "All" || professor.field === params.field;
      const universityMatch =
        !params.university || params.university === "All" || professor.university === params.university;
      const titleMatch = !params.titles?.length || params.titles.includes(professor.title);
      const topicMatch = matchesTopic(professor, params.topic);
      const radiusMatch =
        !origin ||
        distanceMiles(origin.latitude, origin.longitude, professor.latitude, professor.longitude) <= params.radiusMiles;
      return fieldMatch && universityMatch && titleMatch && topicMatch && radiusMatch;
    });

    return {
      total: results.length,
      results,
      universities: mockUniversities,
    };
  }

  async getResearcher(id: string) {
    return mockProfessors.find((professor) => professor.id === id) ?? null;
  }

  async getResearcherPublications(id: string) {
    return mockProfessors.find((professor) => professor.id === id)?.recentPapers ?? [];
  }

  async getResearcherBreakdown(id: string) {
    const professor = mockProfessors.find((candidate) => candidate.id === id);
    if (!professor) {
      return null;
    }

    return {
      workSummary: professor.workSummary,
      researchBreakdown: professor.researchBreakdown,
      whyFit: professor.whyFit,
      currentFocus: professor.currentFocus,
      goodTalkingPoints: professor.goodTalkingPoints,
      recentPapers: professor.recentPapers,
    };
  }

  async getStudentProfile(userId: string) {
    const store = await readLocalStore();
    return (store.profiles[userId] as StudentProfile | undefined) ?? defaultProfile;
  }

  async saveStudentProfile(userId: string, profile: StudentProfile) {
    const store = await readLocalStore();
    store.profiles[userId] = profile;
    await writeLocalStore(store);
    return profile;
  }

  async getOnboarding(userId: string) {
    const profile = await this.getStudentProfile(userId);
    return {
      ...defaultOnboarding,
      profile,
    };
  }

  async saveOnboarding(userId: string, state: OnboardingState) {
    await this.saveStudentProfile(userId, state.profile);
    return state;
  }

  async listSavedResearchers(userId: string) {
    const store = await readLocalStore();
    return store.savedResearchers[userId] ?? mockProfessors.slice(0, 3).map((professor) => professor.id);
  }

  async toggleSavedResearcher(userId: string, researcherId: string) {
    const store = await readLocalStore();
    const current = store.savedResearchers[userId] ?? [];
    const next = current.includes(researcherId)
      ? current.filter((item) => item !== researcherId)
      : [researcherId, ...current];
    store.savedResearchers[userId] = next;
    await writeLocalStore(store);
    return next;
  }

  async listDrafts(userId: string) {
    const store = await readLocalStore();
    return ((store.drafts[userId] as OutreachDraft[] | undefined) ?? seededDrafts).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async getDraft(userId: string, draftId: string) {
    return (await this.listDrafts(userId)).find((draft) => draft.id === draftId) ?? null;
  }

  async saveDraft(userId: string, draft: OutreachDraft) {
    const store = await readLocalStore();
    const drafts = ((store.drafts[userId] as OutreachDraft[] | undefined) ?? seededDrafts).filter(
      (item) => item.id !== draft.id,
    );
    store.drafts[userId] = [draft, ...drafts];
    await writeLocalStore(store);
    return draft;
  }

  async getUniversities() {
    return mockUniversities;
  }

  async getCachedGeneration<T>(cacheKey: string) {
    const store = await readLocalStore();
    return (store.aiCache[cacheKey] as T | undefined) ?? null;
  }

  async setCachedGeneration<T>(cacheKey: string, value: T) {
    const store = await readLocalStore();
    store.aiCache[cacheKey] = value;
    await writeLocalStore(store);
  }

  async logSearchEvent() {
    return;
  }

  async createDraftFromGeneration(userId: string, draft: Omit<OutreachDraft, "id" | "updatedAt">) {
    const hydrated: OutreachDraft = {
      ...draft,
      id: buildCacheKey("draft", { userId, researcherId: draft.professorId, tone: draft.tone, ts: Date.now() }),
      updatedAt: new Date().toISOString(),
    };
    return this.saveDraft(userId, hydrated);
  }

  async saveDraftFeedback(userId: string, draftId: string, analysis: DraftAnalysis) {
    const draft = await this.getDraft(userId, draftId);
    if (!draft) {
      return null;
    }

    const updated: OutreachDraft = {
      ...draft,
      analysis,
      updatedAt: new Date().toISOString(),
    };
    return this.saveDraft(userId, updated);
  }

  async getGenerationContext({ professorId, userId }: DraftGenerationInput & { userId?: string | null }) {
    const professor = await this.getResearcher(professorId);
    if (!professor) {
      throw new Error("Researcher not found.");
    }

    return {
      professor,
      profile: userId ? await this.getStudentProfile(userId) : null,
    };
  }
}
