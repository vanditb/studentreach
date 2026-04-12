import { z } from "zod";
import { DRAFT_TONES, FIELDS, TITLES } from "@/types";

const studentProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  summary: z.string(),
  relatedSkill: z.string(),
});

const studentProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  location: z.string().min(1),
  searchRadius: z.number().int().positive(),
  interest: z.string().min(1),
  field: z.enum(FIELDS),
  projects: z.array(studentProjectSchema),
  hasPriorExposure: z.boolean().nullable(),
  familiarity: z.number().int().nullable(),
  background: z.string(),
  resumeFileName: z.string().optional(),
});

const draftFeedbackItemSchema = z.object({
  label: z.string(),
  tone: z.enum(["good", "suggestion", "warning"]),
  detail: z.string(),
});

const draftAnalysisSchema = z.object({
  outreachFeedback: z.array(draftFeedbackItemSchema),
  preSendCheck: z.array(draftFeedbackItemSchema),
  readinessNudge: z.string().optional(),
});

export const searchResearchersSchema = z.object({
  query: z.string().trim().default(""),
  location: z.string().trim().default(""),
  radius: z.coerce.number().int().positive().default(150),
  field: z.enum(["All", ...FIELDS]).default("All"),
  university: z.string().trim().default("All"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(24),
  titles: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter((item): item is (typeof TITLES)[number] =>
              (TITLES as readonly string[]).includes(item),
            )
        : [...TITLES],
    ),
});

export const draftGenerateSchema = z.object({
  researcherId: z.string().uuid().or(z.string().min(1)),
  tone: z.enum(DRAFT_TONES),
  studentContext: z.string().optional(),
});

export const draftFeedbackSchema = z.object({
  researcherId: z.string().uuid().or(z.string().min(1)),
  content: z.string().min(20),
  draftId: z.string().uuid().optional(),
});

export const profileUpsertSchema = z.object({
  profile: studentProfileSchema,
});

export const onboardingStateSchema = z.object({
  completed: z.boolean(),
  currentStep: z.number().int().min(0),
  profile: studentProfileSchema,
});

export const saveDraftSchema = z.object({
  draft: z.object({
    id: z.string().min(1),
    professorId: z.string().uuid().or(z.string().min(1)),
    tone: z.enum(DRAFT_TONES),
    subject: z.string().min(1),
    content: z.string().min(1),
    status: z.enum(["Draft", "Needs Work", "Ready to Send"]),
    updatedAt: z.string().min(1),
    analysis: draftAnalysisSchema,
  }),
});
