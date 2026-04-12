"use client";

import { STORAGE_KEYS, readStorage } from "@/lib/storage";
import {
  type DraftAnalysis,
  type DraftGenerationInput,
  type OnboardingState,
  type OutreachDraft,
  type SearchParams,
  type SearchResponse,
  type StudentProfile,
  type StudentReachService,
  type Professor,
  type SessionUser,
} from "@/types";

async function request<T>(input: string, init?: RequestInit) {
  const storedUser = readStorage<SessionUser | null>(STORAGE_KEYS.auth, null);
  const effectiveUser =
    storedUser ??
    ({
      id: "guest-demo-user",
      email: "guest@studentreach.app",
      name: "Guest Student",
      mode: "demo",
    } satisfies SessionUser);
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (effectiveUser.mode === "demo") {
    headers.set("x-studentreach-demo-user", JSON.stringify(effectiveUser));
  }

  if (effectiveUser.accessToken) {
    headers.set("Authorization", `Bearer ${effectiveUser.accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export class ApiStudentReachService implements StudentReachService {
  async searchProfessors(params: SearchParams): Promise<SearchResponse> {
    const search = new URLSearchParams({
      query: params.topic,
      location: params.location,
      radius: String(params.radiusMiles),
      field: params.field ?? "All",
      university: params.university ?? "All",
      titles: params.titles?.join(",") ?? "",
    });
    return request<SearchResponse>(`/api/search/researchers?${search.toString()}`);
  }

  async getProfessor(id: string) {
    return request<Professor | null>(`/api/researchers/${id}`);
  }

  async getProfessorInsights(id: string) {
    return request<Pick<
      Professor,
      "workSummary" | "researchBreakdown" | "whyFit" | "currentFocus" | "goodTalkingPoints" | "recentPapers"
    > | null>(`/api/researchers/${id}/breakdown`);
  }

  async getShortlist() {
    return request<string[]>("/api/user/saved");
  }

  async toggleShortlist(id: string) {
    return request<string[]>(`/api/researchers/${id}/save`, { method: "POST" });
  }

  async getDrafts() {
    return request<OutreachDraft[]>("/api/user/drafts");
  }

  async getDraft(id: string) {
    return request<OutreachDraft | null>(`/api/user/drafts?draftId=${encodeURIComponent(id)}`);
  }

  async saveDraft(input: OutreachDraft) {
    return request<OutreachDraft>("/api/user/drafts/save", {
      method: "POST",
      body: JSON.stringify({ draft: input }),
    });
  }

  async generateDraft(input: DraftGenerationInput) {
    return request<OutreachDraft>("/api/drafts/generate", {
      method: "POST",
      body: JSON.stringify({ researcherId: input.professorId, tone: input.tone, studentContext: input.studentContext }),
    });
  }

  async analyzeDraft(content: string, professorId: string) {
    return request<DraftAnalysis>("/api/drafts/feedback", {
      method: "POST",
      body: JSON.stringify({ researcherId: professorId, content }),
    });
  }

  async getProfile() {
    return request<StudentProfile>("/api/profile/upsert");
  }

  async updateProfile(profile: StudentProfile) {
    return request<StudentProfile>("/api/profile/upsert", {
      method: "POST",
      body: JSON.stringify({ profile }),
    });
  }

  async getOnboarding() {
    return request<OnboardingState>("/api/profile/onboarding");
  }

  async saveOnboarding(input: OnboardingState) {
    return request<OnboardingState>("/api/profile/onboarding", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getUniversities() {
    const search = await this.searchProfessors({
      topic: "",
      location: "",
      radiusMiles: 3000,
      field: "All",
      university: "All",
      titles: [],
    });
    return search.universities;
  }
}
