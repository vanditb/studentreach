import { type OnboardingState, type OutreachDraft, type StudentProfile } from "@/types";

export const defaultProfile: StudentProfile = {
  name: "Avery Chen",
  email: "avery@example.com",
  location: "Boston, MA",
  searchRadius: 150,
  interest: "AI for health and useful research projects I can understand well enough to talk about",
  field: "Computer Science / AI",
  projects: [
    {
      id: "project-vision",
      name: "Cell Image Classifier",
      summary:
        "Built a small image classifier to sort microscope images into likely healthy vs abnormal categories using public Kaggle data.",
      relatedSkill: "Python, TensorFlow, model evaluation",
    },
    {
      id: "project-club",
      name: "Robotics Club Outreach Site",
      summary:
        "Designed a simple site that helped our robotics club track mentorship signups and after-school demos.",
      relatedSkill: "React, product thinking, collaboration",
    },
  ],
  hasPriorExposure: true,
  familiarity: 3,
  background:
    "I enjoy building small projects, reading about AI in medicine, and joining research-style competitions. I want professors whose work is technically interesting but still approachable for a motivated high school student.",
  resumeFileName: "avery-chen-resume.pdf",
};

export const defaultOnboarding: OnboardingState = {
  completed: true,
  currentStep: 3,
  profile: defaultProfile,
};

export const seededDrafts: OutreachDraft[] = [
  {
    id: "draft-seeded-1",
    professorId: "cs-berkeley-elena-park",
    tone: "project-based",
    subject: "High school student interested in trustworthy ML systems",
    status: "Needs Work",
    updatedAt: "2026-04-10T16:45:00.000Z",
    content:
      "Dear Professor Park,\n\nMy name is Avery Chen, and I am a high school student in Boston who has been learning about trustworthy machine learning and how models behave in real-world settings. I found your work while looking for professors whose research connects ML systems with real use cases, and I was especially interested in how your lab studies models under noisy deployment conditions.\n\nRecently, I built a small cell image classifier using public data, and the part I found most interesting was not just getting accuracy up, but figuring out why performance changed so much across data splits. That made me more curious about robustness, evaluation, and how researchers decide whether a model is actually ready for use.\n\nI would be grateful for the chance to learn more about your work and whether there are readings, talks, or small ways I could keep learning in this area.\n\nThank you for your time,\nAvery Chen",
    analysis: {
      outreachFeedback: [
        {
          label: "Strong opening",
          tone: "good",
          detail: "You connect your interest directly to one part of the professor's work instead of starting generic.",
        },
        {
          label: "Needs one sharper reference",
          tone: "suggestion",
          detail: "Mention one paper, lab project, or dataset name so the email feels even more anchored.",
        },
      ],
      preSendCheck: [
        {
          label: "Project mention included",
          tone: "good",
          detail: "You gave one concrete project, which makes the note more believable.",
        },
        {
          label: "Ask stays light",
          tone: "good",
          detail: "The ask is reasonable and does not pressure the professor for a formal commitment.",
        },
      ],
      readinessNudge: "You are close. One specific paper reference would make this feel much more tailored.",
    },
  },
];
