"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/use-studentreach";
import { FIELDS } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  location: z.string().min(2),
  searchRadius: z.number().min(25).max(3000),
  interest: z.string().min(6),
  field: z.enum(FIELDS),
  projectsText: z.string().optional(),
  resumeFileName: z.string().optional(),
  background: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      location: "",
      searchRadius: 150,
      interest: "",
      field: "Computer Science / AI",
      projectsText: "",
      resumeFileName: "",
      background: "",
    },
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    form.reset({
      name: profileQuery.data.name,
      email: profileQuery.data.email,
      location: profileQuery.data.location,
      searchRadius: profileQuery.data.searchRadius,
      interest: profileQuery.data.interest,
      field: profileQuery.data.field,
      projectsText: profileQuery.data.projects.map((project) => `${project.name}: ${project.summary}`).join("\n"),
      resumeFileName: profileQuery.data.resumeFileName ?? "",
      background: profileQuery.data.background,
    });
  }, [profileQuery.data, form]);

  async function onSubmit(values: FormValues) {
    await updateProfile.mutateAsync({
      name: values.name,
      email: values.email,
      location: values.location,
      searchRadius: values.searchRadius,
      interest: values.interest,
      field: values.field,
      projects: values.projectsText
        ? values.projectsText.split("\n").filter(Boolean).map((line, index) => ({
            id: `profile-project-${index + 1}`,
            name: line.split(":")[0]?.trim() || `Project ${index + 1}`,
            summary: line.split(":").slice(1).join(":").trim() || line.trim(),
            relatedSkill: "Independent project",
          }))
        : [],
      hasPriorExposure: profileQuery.data?.hasPriorExposure ?? null,
      familiarity: profileQuery.data?.familiarity ?? null,
      resumeFileName: values.resumeFileName,
      background: values.background ?? "",
    });
    toast.success("Profile updated.");
  }

  if (profileQuery.isLoading) {
    return <Skeleton className="h-[520px] w-full rounded-[2rem]" />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Profile"
        title="Keep your research context current."
        description="Update interests, project notes, and resume details any time. Better context leads to better fit explanations and stronger draft suggestions."
      />

      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>Student profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...form.register("location")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Search radius</Label>
              <Input id="radius" type="number" min={25} max={3000} {...form.register("searchRadius", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="interest">Interests</Label>
              <Textarea id="interest" {...form.register("interest")} />
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
            <div className="space-y-2">
              <Label htmlFor="resume">Resume</Label>
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="projects">Projects</Label>
              <Textarea id="projects" {...form.register("projectsText")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="background">Background</Label>
              <Textarea id="background" {...form.register("background")} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
