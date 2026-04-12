export const FIELDS = [
  "Computer Science / AI",
  "Biology / Biotech",
  "Physics",
  "Engineering",
  "Psychology / Neuroscience",
  "Economics / Social Science",
  "Chemistry",
] as const;

export const TITLES = ["Professor", "Associate Professor", "Assistant Professor"] as const;
export const DRAFT_TONES = ["curious", "project-based", "formal"] as const;
export const DRAFT_STATUSES = ["Draft", "Needs Work", "Ready to Send"] as const;

export type Field = (typeof FIELDS)[number];
export type ProfessorTitle = (typeof TITLES)[number];
export type DraftTone = (typeof DRAFT_TONES)[number];
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export type ResearchBreakdownItem = {
  label: string;
  value: string;
};

export type Paper = {
  id: string;
  title: string;
  venue: string;
  year: number;
  summary: string;
};

export type Professor = {
  id: string;
  name: string;
  title: ProfessorTitle;
  university: string;
  department: string;
  field: Field;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  facultyPage: string;
  email: string;
  researchTags: string[];
  currentFocus: string;
  whyFit: string;
  workSummary: string;
  researchBreakdown: ResearchBreakdownItem[];
  goodTalkingPoints: string[];
  recentPapers: Paper[];
  recentPublicationCount: number;
  credibilitySignal: string;
  summaryReady: boolean;
};

export type SearchParams = {
  topic: string;
  location: string;
  radiusMiles: number;
  field?: Field | "All";
  university?: string | "All";
  titles?: ProfessorTitle[];
};

export type SearchResponse = {
  total: number;
  results: Professor[];
  universities: string[];
};

export type StudentProject = {
  id: string;
  name: string;
  summary: string;
  relatedSkill: string;
};

export type StudentProfile = {
  name: string;
  email: string;
  location: string;
  searchRadius: number;
  interest: string;
  field: Field;
  projects: StudentProject[];
  hasPriorExposure: boolean | null;
  familiarity: number | null;
  background: string;
  resumeFileName?: string;
};

export type OnboardingState = {
  completed: boolean;
  currentStep: number;
  profile: StudentProfile;
};

export type DraftFeedbackItem = {
  label: string;
  tone: "good" | "suggestion" | "warning";
  detail: string;
};

export type DraftAnalysis = {
  outreachFeedback: DraftFeedbackItem[];
  preSendCheck: DraftFeedbackItem[];
  readinessNudge?: string;
};

export type OutreachDraft = {
  id: string;
  professorId: string;
  tone: DraftTone;
  subject: string;
  content: string;
  status: DraftStatus;
  updatedAt: string;
  analysis: DraftAnalysis;
};

export type DraftGenerationInput = {
  professorId: string;
  tone: DraftTone;
  studentContext?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  mode: "demo" | "supabase";
};

export type AuthCredentials = {
  email: string;
  password: string;
  name?: string;
};

export type ServiceResult<T> = Promise<T>;

export type StudentReachService = {
  searchProfessors(params: SearchParams): ServiceResult<SearchResponse>;
  getProfessor(id: string): ServiceResult<Professor | null>;
  getProfessorInsights(id: string): ServiceResult<Pick<
    Professor,
    "workSummary" | "researchBreakdown" | "whyFit" | "currentFocus" | "goodTalkingPoints" | "recentPapers"
  > | null>;
  getShortlist(): ServiceResult<string[]>;
  toggleShortlist(id: string): ServiceResult<string[]>;
  getDrafts(): ServiceResult<OutreachDraft[]>;
  getDraft(id: string): ServiceResult<OutreachDraft | null>;
  saveDraft(input: OutreachDraft): ServiceResult<OutreachDraft>;
  generateDraft(input: DraftGenerationInput): ServiceResult<OutreachDraft>;
  analyzeDraft(content: string, professorId: string): ServiceResult<DraftAnalysis>;
  getProfile(): ServiceResult<StudentProfile>;
  updateProfile(profile: StudentProfile): ServiceResult<StudentProfile>;
  getOnboarding(): ServiceResult<OnboardingState>;
  saveOnboarding(input: OnboardingState): ServiceResult<OnboardingState>;
  getUniversities(): ServiceResult<string[]>;
};
