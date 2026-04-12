"use client";

import { STORAGE_KEYS, readStorage, writeStorage } from "@/lib/storage";
import {
  type DraftAnalysis,
  type DraftGenerationInput,
  type OnboardingState,
  type OutreachDraft,
  type Professor,
  type SearchParams,
  type SearchResponse,
  type StudentProfile,
  type StudentReachService,
} from "@/types";
import { defaultOnboarding, defaultProfile, seededDrafts } from "@/data/mock/profile";
import { mockProfessors, mockUniversities } from "@/data/mock/professors";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

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

const locationLookup = new Map(
  mockProfessors.map((professor) => [
    normalize(`${professor.city}, ${professor.state}`),
    { latitude: professor.latitude, longitude: professor.longitude },
  ]),
);

function resolveSearchOrigin(location: string) {
  const normalized = normalize(location);
  if (!normalized) {
    return null;
  }

  if (locationLookup.has(normalized)) {
    return locationLookup.get(normalized)!;
  }

  for (const [key, value] of locationLookup.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  return null;
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

  return normalize(topic)
    .split(/\s+/)
    .every((token) => haystack.includes(token));
}

function loadShortlist() {
  return readStorage<string[]>(STORAGE_KEYS.shortlist, mockProfessors.slice(0, 3).map((professor) => professor.id));
}

function loadDrafts() {
  return readStorage<OutreachDraft[]>(STORAGE_KEYS.drafts, seededDrafts);
}

function buildAnalysis(content: string, professor: Professor): DraftAnalysis {
  const lower = content.toLowerCase();
  const mentionsProject = /(project|built|designed|made|created)/.test(lower);
  const mentionsProfessorWork = professor.researchTags.some((tag) => lower.includes(tag.split(" ")[0]));
  const tooGeneric = /(your research is very inspiring|i would love to join your lab)/.test(lower);

  return {
    outreachFeedback: [
      {
        label: mentionsProfessorWork ? "Personalization is visible" : "Could be more specific",
        tone: mentionsProfessorWork ? "good" : "suggestion",
        detail: mentionsProfessorWork
          ? "You reference part of the professor's work instead of relying on generic praise."
          : "Try naming one tag, paper topic, or current focus area from this professor's profile.",
      },
      {
        label: mentionsProject ? "Student context is concrete" : "Add one proof point",
        tone: mentionsProject ? "good" : "suggestion",
        detail: mentionsProject
          ? "A project or built example gives the professor a reason to trust your interest."
          : "Mention one project, course, or experiment so your interest does not feel abstract.",
      },
      {
        label: tooGeneric ? "Tone drifts broad" : "Tone stays grounded",
        tone: tooGeneric ? "warning" : "good",
        detail: tooGeneric
          ? "Cut broad compliments and replace them with one sentence about what specifically caught your eye."
          : "The draft avoids over-flattery and stays focused on interest plus fit.",
      },
    ],
    preSendCheck: [
      {
        label: "Ask is light",
        tone: "good",
        detail: "Students should keep the ask small: a reply, a reading suggestion, or a quick pointer is enough.",
      },
      {
        label: "Final scan for specifics",
        tone: "suggestion",
        detail: `Before sending, make sure ${professor.name.split(" ")[1]}'s work appears in at least one concrete sentence.`,
      },
    ],
    readinessNudge: mentionsProject
      ? "You have enough substance here. One sharper research reference would make it even stronger."
      : "You might improve your chances by mentioning one project or course that proves this topic is more than a passing interest.",
  };
}

function buildDraft(input: DraftGenerationInput, professor: Professor, profile: StudentProfile): OutreachDraft {
  const openingByTone = {
    curious:
      "I have been trying to understand which professors are working on questions that feel both technically interesting and genuinely important.",
    "project-based":
      "I wanted to reach out because your work connects strongly with a project-based direction I have been exploring on my own.",
    formal:
      "I am writing as a high school student interested in learning more about your research and how students begin to engage with work in this area.",
  } as const;

  const projectLine = profile.projects[0]
    ? `One recent project I built was ${profile.projects[0].name}, where I ${profile.projects[0].summary.toLowerCase()}.`
    : "I have been learning through independent reading and smaller experiments related to this topic.";

  const content = [
    `Dear ${professor.title} ${professor.name.split(" ").slice(-1)[0]},`,
    "",
    `My name is ${profile.name}, and I am a high school student based in ${profile.location}. ${openingByTone[input.tone]}`,
    `I found your work while looking for professors working on ${professor.researchTags[0]} and ${professor.researchTags[1]}, and I was especially interested in how your group is ${professor.currentFocus}.`,
    projectLine,
    `What stood out to me is that your research seems to combine ${professor.researchTags[0]} with ${professor.researchTags[2]} in a way that feels both rigorous and practical.`,
    "If you have any suggested readings, talks, or advice on how a student at my stage could learn more thoughtfully in this area, I would be very grateful.",
    "",
    `Thank you for your time,\n${profile.name}`,
  ].join("\n");

  return {
    id: `draft-${Date.now()}`,
    professorId: professor.id,
    tone: input.tone,
    subject: `High school student interested in ${professor.researchTags[0]}`,
    content,
    status: "Draft",
    updatedAt: new Date().toISOString(),
    analysis: buildAnalysis(content, professor),
  };
}

export class StudentReachMockService implements StudentReachService {
  async searchProfessors(params: SearchParams): Promise<SearchResponse> {
    await wait(280);
    const origin = resolveSearchOrigin(params.location);
    const results = mockProfessors.filter((professor) => {
      const inTopic = matchesTopic(professor, params.topic);
      const inField = !params.field || params.field === "All" || professor.field === params.field;
      const inUniversity =
        !params.university || params.university === "All" || professor.university === params.university;
      const inTitle = !params.titles?.length || params.titles.includes(professor.title);
      const inRadius =
        !origin ||
        distanceMiles(origin.latitude, origin.longitude, professor.latitude, professor.longitude) <= params.radiusMiles;
      return inTopic && inField && inUniversity && inTitle && inRadius;
    });

    return {
      total: results.length,
      results,
      universities: mockUniversities,
    };
  }

  async getProfessor(id: string) {
    await wait(180);
    return mockProfessors.find((professor) => professor.id === id) ?? null;
  }

  async getProfessorInsights(id: string) {
    await wait(550);
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

  async getShortlist() {
    await wait(120);
    return loadShortlist();
  }

  async toggleShortlist(id: string) {
    await wait(120);
    const shortlist = loadShortlist();
    const next = shortlist.includes(id) ? shortlist.filter((item) => item !== id) : [id, ...shortlist];
    writeStorage(STORAGE_KEYS.shortlist, next);
    return next;
  }

  async getDrafts() {
    await wait(160);
    return loadDrafts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getDraft(id: string) {
    await wait(140);
    return loadDrafts().find((draft) => draft.id === id) ?? null;
  }

  async saveDraft(input: OutreachDraft) {
    await wait(140);
    const drafts = loadDrafts();
    const next = [input, ...drafts.filter((draft) => draft.id !== input.id)];
    writeStorage(STORAGE_KEYS.drafts, next);
    return input;
  }

  async generateDraft(input: DraftGenerationInput) {
    await wait(680);
    const professor = mockProfessors.find((candidate) => candidate.id === input.professorId);
    if (!professor) {
      throw new Error("Professor not found.");
    }

    const profile = await this.getProfile();
    const draft = buildDraft(input, professor, profile);
    await this.saveDraft(draft);
    return draft;
  }

  async analyzeDraft(content: string, professorId: string) {
    await wait(360);
    const professor = mockProfessors.find((candidate) => candidate.id === professorId);
    if (!professor) {
      throw new Error("Professor not found.");
    }

    return buildAnalysis(content, professor);
  }

  async getProfile() {
    await wait(120);
    return readStorage<StudentProfile>(STORAGE_KEYS.profile, defaultProfile);
  }

  async updateProfile(profile: StudentProfile) {
    await wait(160);
    writeStorage(STORAGE_KEYS.profile, profile);
    return profile;
  }

  async getOnboarding() {
    await wait(120);
    return readStorage<OnboardingState>(STORAGE_KEYS.onboarding, defaultOnboarding);
  }

  async saveOnboarding(input: OnboardingState) {
    await wait(160);
    writeStorage(STORAGE_KEYS.onboarding, input);
    writeStorage(STORAGE_KEYS.profile, input.profile);
    return input;
  }

  async getUniversities() {
    await wait(80);
    return mockUniversities;
  }
}
