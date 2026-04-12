"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding, useSaveOnboarding } from "@/hooks/use-studentreach";
import { FIELDS } from "@/types";

const schema = z.object({
  interest: z.string().min(6, "Share a little more about what you want to explore."),
  field: z.enum(FIELDS),
  location: z.string().min(2, "Enter a location."),
  searchRadius: z.number().min(25).max(3000),
  projectsText: z.string().optional(),
  hasPriorExposure: z.enum(["yes", "no", "not-yet"]).optional(),
  familiarity: z.enum(["1", "2", "3", "4", "5"]).optional(),
  resumeFileName: z.string().optional(),
  background: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const stepCopy = [
  {
    label: "Focus",
    title: "What are you hoping to research?",
    description: "We only need a starting point. You do not need a polished niche yet.",
  },
  {
    label: "Search setup",
    title: "Where should StudentReach look first?",
    description: "We will use this to make discovery faster and more relevant.",
  },
  {
    label: "Tell us more",
    title: "Optional context that can improve outreach later",
    description: "Totally skippable. Even one project or class reference can help your drafts feel more grounded.",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const { data, isLoading } = useOnboarding();
  const saveOnboarding = useSaveOnboarding();
  const [step, setStep] = useState(0);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      interest: "",
      field: "Computer Science / AI",
      location: "",
      searchRadius: 150,
      projectsText: "",
      hasPriorExposure: "not-yet",
      familiarity: "3",
      resumeFileName: "",
      background: "",
    },
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setStep(Math.min(data.currentStep, 2));
    form.reset({
      interest: data.profile.interest,
      field: data.profile.field,
      location: data.profile.location,
      searchRadius: data.profile.searchRadius,
      projectsText: data.profile.projects.map((project) => `${project.name}: ${project.summary}`).join("\n"),
      hasPriorExposure:
        data.profile.hasPriorExposure === null ? "not-yet" : data.profile.hasPriorExposure ? "yes" : "no",
      familiarity: data.profile.familiarity ? String(data.profile.familiarity) as FormValues["familiarity"] : "3",
      resumeFileName: data.profile.resumeFileName ?? "",
      background: data.profile.background,
    });
  }, [data, form]);

  const currentStep = stepCopy[step];

  async function persist(values: FormValues, nextStep: number, completed = false) {
    await saveOnboarding.mutateAsync({
      completed,
      currentStep: nextStep,
      profile: {
        name: data?.profile.name ?? "Student",
        email: data?.profile.email ?? "student@example.com",
        interest: values.interest,
        field: values.field,
        location: values.location,
        searchRadius: values.searchRadius,
        projects: values.projectsText
          ? values.projectsText.split("\n").filter(Boolean).map((line, index) => ({
              id: `project-${index + 1}`,
              name: line.split(":")[0]?.trim() || `Project ${index + 1}`,
              summary: line.split(":").slice(1).join(":").trim() || line.trim(),
              relatedSkill: "Independent project",
            }))
          : [],
        hasPriorExposure:
          values.hasPriorExposure === "not-yet" ? null : values.hasPriorExposure === "yes",
        familiarity: values.familiarity ? Number(values.familiarity) : null,
        resumeFileName: values.resumeFileName,
        background: values.background ?? "",
      },
    });
  }

  async function next() {
    const valid =
      step === 0
        ? await form.trigger(["interest", "field"])
        : step === 1
          ? await form.trigger(["location", "searchRadius"])
          : await form.trigger();

    if (!valid) {
      return;
    }

    const values = form.getValues();
    const nextStep = Math.min(step + 1, 3);
    await persist(values, nextStep, nextStep >= 3);

    if (step >= 2) {
      toast.success("Onboarding saved.");
      router.push("/discover");
      return;
    }

    setStep((current) => current + 1);
  }

  async function skipOptional() {
    const values = form.getValues();
    await persist(values, 3, true);
    toast.success("Optional step skipped.");
    router.push("/discover");
  }

  const progress = useMemo(() => `${step + 1} / ${stepCopy.length}`, [step]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[420px] w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="space-y-5">
        <SectionHeading
          eyebrow={`Onboarding · ${progress}`}
          title={currentStep.title}
          description={currentStep.description}
        />
        <Card className="bg-white/72">
          <CardContent className="space-y-4 p-6">
            <div className="text-sm leading-6 text-muted-foreground">
              StudentReach is designed to help even if you are still early. You do not need a stacked resume to get useful suggestions.
            </div>
            <div className="flex gap-2">
              {stepCopy.map((item, index) => (
                <div
                  key={item.label}
                  className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-primary/12"}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Card className="bg-white/82">
          <CardHeader>
            <CardTitle>{currentStep.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="interest">Area of interest</Label>
                  <Textarea
                    id="interest"
                    placeholder="I am interested in AI for health, especially projects that combine data, medicine, and model reliability."
                    {...form.register("interest")}
                  />
                  <p className="text-sm text-destructive">{form.formState.errors.interest?.message}</p>
                </div>
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={form.watch("field")}
                    onValueChange={(value) => form.setValue("field", value as FormValues["field"], { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Boston, MA" {...form.register("location")} />
                  <p className="text-sm text-destructive">{form.formState.errors.location?.message}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radius-range">Search radius</Label>
                    <div className="text-sm font-medium text-foreground">{form.watch("searchRadius")} miles</div>
                  </div>
                  <input
                    id="radius-range"
                    type="range"
                    min={25}
                    max={3000}
                    step={25}
                    className="w-full accent-[var(--primary)]"
                    value={form.watch("searchRadius")}
                    onChange={(event) => form.setValue("searchRadius", Number(event.target.value), { shouldValidate: true })}
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="projectsText">Projects built related to this interest</Label>
                  <Textarea
                    id="projectsText"
                    placeholder="Cell Image Classifier: used public microscope data to compare model performance across classes"
                    {...form.register("projectsText")}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Have you learned about this topic before?</Label>
                  <RadioGroup
                    value={form.watch("hasPriorExposure")}
                    onValueChange={(value) => form.setValue("hasPriorExposure", value as FormValues["hasPriorExposure"])}
                    className="grid gap-3"
                  >
                    {[
                      ["yes", "Yes, a bit"],
                      ["no", "Not really"],
                      ["not-yet", "Still early"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-3 rounded-2xl border border-border bg-background-soft px-4 py-3">
                        <RadioGroupItem value={value} />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Self-rated topic familiarity</Label>
                  <Select
                    value={form.watch("familiarity")}
                    onValueChange={(value) => form.setValue("familiarity", value as FormValues["familiarity"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 · Just starting</SelectItem>
                      <SelectItem value="2">2 · Early but curious</SelectItem>
                      <SelectItem value="3">3 · Comfortable with basics</SelectItem>
                      <SelectItem value="4">4 · Built a few related things</SelectItem>
                      <SelectItem value="5">5 · Very confident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Optional resume upload</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      form.setValue("resumeFileName", file?.name ?? "");
                    }}
                  />
                  {form.watch("resumeFileName") ? (
                    <div className="text-sm text-muted-foreground">Attached: {form.watch("resumeFileName")}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Anything else we should know?</Label>
                  <Textarea
                    id="background"
                    placeholder="I like building small tools, reading papers with friends, and learning from project-based classes."
                    {...form.register("background")}
                  />
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((current) => current - 1)}>
                  Back
                </Button>
              ) : null}
              {step === 2 ? (
                <Button variant="secondary" onClick={() => void skipOptional()}>
                  Skip for now
                </Button>
              ) : null}
              <Button onClick={() => void next()} disabled={saveOnboarding.isPending}>
                {saveOnboarding.isPending ? "Saving..." : step === 2 ? "Finish" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
