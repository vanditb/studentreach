import OpenAI from "openai";
import { buildCacheKey } from "@/server/cache/keying";
import { getStudentReachRepository } from "@/server/repositories";
import { getServerEnv, hasOpenAIEnv } from "@/server/env";
import { type DraftAnalysis, type DraftTone, type OutreachDraft, type Professor, type StudentProfile } from "@/types";

type ResearcherInsightPayload = {
  workSummary: string;
  researchBreakdown: { label: string; value: string }[];
  whyFit: string;
  currentFocus: string;
  goodTalkingPoints: string[];
};

function makeFallbackInsight(professor: Professor, profile?: StudentProfile | null): ResearcherInsightPayload {
  const fitContext = profile?.projects[0]?.summary ?? profile?.interest ?? "a motivated high school student learning in this area";
  return {
    workSummary:
      professor.workSummary ||
      `${professor.name} works on ${professor.researchTags.join(", ")} with a recent focus on ${professor.currentFocus}.`,
    researchBreakdown:
      professor.researchBreakdown.length > 0
        ? professor.researchBreakdown
        : [
            { label: "Core Area", value: professor.researchTags[0] ?? professor.field },
            { label: "Current Focus", value: professor.currentFocus },
            { label: "Student Angle", value: `This could connect well with ${fitContext}.` },
          ],
    whyFit:
      professor.whyFit ||
      `This might be a fit if you want work connected to ${professor.researchTags[0] ?? professor.field} and can point to ${fitContext}.`,
    currentFocus: professor.currentFocus,
    goodTalkingPoints:
      professor.goodTalkingPoints.length > 0
        ? professor.goodTalkingPoints
        : [
            `Mention what specifically caught your eye about ${professor.researchTags[0] ?? professor.field}.`,
            "Point to one concrete project, class, or paper that made the topic feel real to you.",
            "Keep the ask small and curiosity-driven.",
          ],
  };
}

function makeFallbackDraft({
  professor,
  profile,
  tone,
}: {
  professor: Professor;
  profile: StudentProfile | null;
  tone: DraftTone;
}): Omit<OutreachDraft, "id" | "updatedAt"> {
  const opener = {
    curious:
      "I have been trying to get clearer about which professors are working on questions that feel both intellectually interesting and meaningful in practice.",
    "project-based":
      "I wanted to reach out because your work connects strongly with a project direction I have been exploring on my own.",
    formal:
      "I am writing as a high school student who is trying to learn more carefully about research in this area.",
  } as const;

  const projectLine = profile?.projects[0]
    ? `One project I recently built was ${profile.projects[0].name}, where I ${profile.projects[0].summary.toLowerCase()}.`
    : "I have been learning through smaller projects, reading, and classes related to this topic.";

  const content = [
    `Dear ${professor.title} ${professor.name.split(" ").slice(-1)[0]},`,
    "",
    `My name is ${profile?.name ?? "a high school student"}, and I am based in ${profile?.location ?? "the United States"}. ${opener[tone]}`,
    `I found your work while looking for professors working on ${professor.researchTags.slice(0, 2).join(" and ")}, and I was especially interested in how your recent work focuses on ${professor.currentFocus}.`,
    projectLine,
    `What stood out to me is that your research seems to combine ${professor.researchTags[0] ?? professor.field} with ${professor.researchTags[1] ?? professor.field} in a way that feels rigorous and concrete.`,
    "If you have any recommended readings, talks, or advice on how a student at my stage could keep learning in this area, I would be very grateful.",
    "",
    `Thank you for your time,\n${profile?.name ?? "Student"}`,
  ].join("\n");

  return {
    professorId: professor.id,
    tone,
    subject: `High school student interested in ${professor.researchTags[0] ?? professor.field}`,
    content,
    status: "Draft",
    analysis: makeFallbackFeedback(content, professor, profile),
  };
}

function makeFallbackFeedback(content: string, professor: Professor, profile?: StudentProfile | null): DraftAnalysis {
  const lower = content.toLowerCase();
  const mentionsProject = /(project|built|designed|created|made)/.test(lower);
  const mentionsSpecificResearch = professor.researchTags.some((tag) => lower.includes(tag.split(" ")[0]));

  return {
    outreachFeedback: [
      {
        label: mentionsSpecificResearch ? "Personalization is visible" : "Could be more specific",
        tone: mentionsSpecificResearch ? "good" : "suggestion",
        detail: mentionsSpecificResearch
          ? "You reference a concrete part of the professor's work instead of writing a generic note."
          : "Mention one research tag, paper theme, or current focus detail from the professor profile.",
      },
      {
        label: mentionsProject ? "You brought your own context" : "Add one proof point",
        tone: mentionsProject ? "good" : "suggestion",
        detail: mentionsProject
          ? "A project or course mention helps the email feel grounded."
          : `Consider mentioning ${profile?.projects[0]?.name ?? "one project or course"} so your interest feels earned.`,
      },
      {
        label: "Tone stays supportive",
        tone: "good",
        detail: "The note keeps the ask light and does not overstate what you are asking for.",
      },
    ],
    preSendCheck: [
      {
        label: "Keep the ask modest",
        tone: "good",
        detail: "A small ask like readings, advice, or a quick pointer is stronger than asking for too much upfront.",
      },
      {
        label: "One last specificity pass",
        tone: "suggestion",
        detail: `Before sending, make sure one sentence clearly explains why ${professor.name} specifically caught your eye.`,
      },
    ],
    readinessNudge: mentionsProject
      ? "You already have some substance here. One sharper reference to the professor's recent work would make it even stronger."
      : "You might improve your chances by mentioning one project, course, or concrete reason you care about this topic.",
  };
}

function getOpenAIClient() {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

async function requestJson<T>(prompt: string, fallback: T) {
  if (!hasOpenAIEnv()) {
    return fallback;
  }

  try {
    const env = getServerEnv();
    const client = getOpenAIClient();
    const response = await client!.responses.create({
      model: env.OPENAI_MODEL!,
      input: prompt,
    });
    const text = response.output_text.trim();
    return (JSON.parse(text) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getResearcherInsightGeneration(researcherId: string, profile?: StudentProfile | null) {
  const repository = getStudentReachRepository();
  const professor = await repository.getResearcher(researcherId);
  if (!professor) {
    throw new Error("Researcher not found.");
  }

  const cacheKey = buildCacheKey("researcher-insight", {
    researcherId,
    profile: profile?.interest ?? null,
  });
  const cached = await repository.getCachedGeneration<ResearcherInsightPayload>(cacheKey);
  if (cached) {
    return cached;
  }

  const fallback = makeFallbackInsight(professor, profile);
  const result = await requestJson<ResearcherInsightPayload>(
    [
      "Return valid JSON only.",
      "You are generating grounded academic profile copy for StudentReach.",
      "Use only the supplied researcher data. Do not invent facts, publications, labs, or emails.",
      `Researcher: ${professor.name}`,
      `Field: ${professor.field}`,
      `Tags: ${professor.researchTags.join(", ")}`,
      `Current focus: ${professor.currentFocus}`,
      `Existing summary: ${professor.workSummary}`,
      `Student context: ${profile?.interest ?? "No profile context provided."}`,
      'Return JSON with keys: workSummary, researchBreakdown (array of {label,value}), whyFit, currentFocus, goodTalkingPoints (array of strings).',
    ].join("\n"),
    fallback,
  );
  await repository.setCachedGeneration(cacheKey, result);
  return result;
}

export async function generateDraftForUser({
  userId,
  researcherId,
  tone,
}: {
  userId: string;
  researcherId: string;
  tone: DraftTone;
}) {
  const repository = getStudentReachRepository();
  const { professor, profile } = await repository.getGenerationContext({ professorId: researcherId, tone, userId });
  const cacheKey = buildCacheKey("draft-generate", {
    userId,
    researcherId,
    tone,
    profileHash: profile?.interest ?? null,
  });
  const cached = await repository.getCachedGeneration<Omit<OutreachDraft, "id" | "updatedAt">>(cacheKey);
  if (cached) {
    return repository.createDraftFromGeneration(userId, cached);
  }

  const fallback = makeFallbackDraft({ professor, profile, tone });
  const generated = await requestJson<Omit<OutreachDraft, "id" | "updatedAt">>(
    [
      "Return valid JSON only.",
      "You are drafting an outreach email for a high school student.",
      "Keep the tone grounded, respectful, and specific. No exaggerated praise. No mass-email language.",
      "Use only the supplied student and researcher context.",
      `Researcher name: ${professor.name}`,
      `Research tags: ${professor.researchTags.join(", ")}`,
      `Current focus: ${professor.currentFocus}`,
      `Student interest: ${profile?.interest ?? ""}`,
      `Student projects: ${profile?.projects.map((project) => `${project.name}: ${project.summary}`).join("; ") ?? ""}`,
      `Tone: ${tone}`,
      'Return JSON with keys: professorId, tone, subject, content, status, analysis.',
    ].join("\n"),
    fallback,
  );
  await repository.setCachedGeneration(cacheKey, generated);
  return repository.createDraftFromGeneration(userId, generated);
}

export async function generateDraftFeedback({
  userId,
  researcherId,
  content,
  draftId,
}: {
  userId: string;
  researcherId: string;
  content: string;
  draftId?: string;
}) {
  const repository = getStudentReachRepository();
  const { professor, profile } = await repository.getGenerationContext({
    professorId: researcherId,
    tone: "curious",
    userId,
  });
  const cacheKey = buildCacheKey("draft-feedback", {
    userId,
    researcherId,
    content,
  });
  const cached = await repository.getCachedGeneration<DraftAnalysis>(cacheKey);
  if (cached) {
    if (draftId) {
      await repository.saveDraftFeedback(userId, draftId, cached);
    }
    return cached;
  }

  const fallback = makeFallbackFeedback(content, professor, profile);
  const result = await requestJson<DraftAnalysis>(
    [
      "Return valid JSON only.",
      "You are reviewing a student outreach email draft for StudentReach.",
      "The output must be supportive and never say the student is unqualified.",
      "Use only the supplied draft and researcher context.",
      `Researcher: ${professor.name}`,
      `Tags: ${professor.researchTags.join(", ")}`,
      `Current focus: ${professor.currentFocus}`,
      `Student profile: ${profile?.interest ?? ""}`,
      `Draft:\n${content}`,
      'Return JSON with keys: outreachFeedback (array of {label,tone,detail}), preSendCheck (array of {label,tone,detail}), readinessNudge.',
    ].join("\n"),
    fallback,
  );
  await repository.setCachedGeneration(cacheKey, result);
  if (draftId) {
    await repository.saveDraftFeedback(userId, draftId, result);
  }
  return result;
}
