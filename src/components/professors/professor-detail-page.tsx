"use client";

import Link from "next/link";
import { ExternalLink, Mail, NotebookPen, Star } from "lucide-react";
import { ResearchTag } from "@/components/shared/research-tag";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProfessor,
  useProfessorInsights,
  useShortlist,
  useToggleShortlist,
} from "@/hooks/use-studentreach";
import { RecentPapersList } from "./recent-papers-list";
import { ResearchBreakdownPanel } from "./research-breakdown-panel";

export function ProfessorDetailPage({ professorId }: { professorId: string }) {
  const professorQuery = useProfessor(professorId);
  const insightsQuery = useProfessorInsights(professorId);
  const { data: shortlist = [] } = useShortlist();
  const toggleShortlist = useToggleShortlist();

  const professor = professorQuery.data;
  const saved = professor ? shortlist.includes(professor.id) : false;

  if (professorQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-[220px] w-full rounded-[1.5rem]" />
        <Skeleton className="h-[320px] w-full rounded-[1.5rem]" />
      </div>
    );
  }

  if (!professor) {
    return (
      <Card className="bg-paper">
        <CardContent className="p-6 text-sm text-muted-foreground">
          That professor could not be found.
        </CardContent>
      </Card>
    );
  }

  const workSummary = insightsQuery.data?.workSummary ?? professor.workSummary;
  const currentFocus = insightsQuery.data?.currentFocus ?? professor.currentFocus;
  const whyFit = insightsQuery.data?.whyFit ?? professor.whyFit;
  const talkingPoints = insightsQuery.data?.goodTalkingPoints ?? professor.goodTalkingPoints;
  const papers = insightsQuery.data?.recentPapers ?? professor.recentPapers;

  return (
    <div className="space-y-8">
      <div className="text-sm text-muted-foreground">
        <Link href="/discover" className="font-medium text-primary">
          Search
        </Link>
        <span className="mx-2">/</span>
        <span>{professor.name}</span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className="border-b border-border pb-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-3xl">
                <SectionHeading
                  title={professor.name}
                  description={`${professor.title} · ${professor.university} · ${professor.department}`}
                />
                <div className="mt-5 flex flex-wrap gap-2">
                  {professor.researchTags.map((tag) => (
                    <ResearchTag key={tag} label={tag} />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/drafts?professor=${professor.id}`}>
                    <NotebookPen className="h-4 w-4" />
                    Write email
                  </Link>
                </Button>
                <Button variant="secondary" onClick={() => toggleShortlist.mutate(professor.id)}>
                  <Star className="h-4 w-4" />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </section>

          <Card className="bg-paper">
            <CardHeader>
              <CardTitle>What they work on</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsQuery.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <p className="text-base leading-8 text-muted-foreground">{workSummary}</p>
              )}
            </CardContent>
          </Card>

          <ResearchBreakdownPanel items={insightsQuery.data?.researchBreakdown ?? professor.researchBreakdown} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-paper">
              <CardHeader>
                <CardTitle>Why this might be a fit</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">{whyFit}</CardContent>
            </Card>

            <Card className="bg-paper">
              <CardHeader>
                <CardTitle>Current focus</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">{currentFocus}</CardContent>
            </Card>
          </div>

          <Card className="bg-paper">
            <CardHeader>
              <CardTitle>What to mention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {talkingPoints.map((point) => (
                <div key={point} className="rounded-[1.2rem] border border-border bg-background-soft p-4 text-sm leading-6 text-muted-foreground">
                  {point}
                </div>
              ))}
            </CardContent>
          </Card>

          <RecentPapersList papers={papers} />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="bg-paper">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/drafts?professor=${professor.id}`}>Write email</Link>
              </Button>

              {professor.facultyPage ? (
                <Button asChild variant="outline" className="w-full">
                  <a href={professor.facultyPage} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Faculty page
                  </a>
                </Button>
              ) : null}

              {professor.email ? (
                <Button asChild variant="secondary" className="w-full">
                  <a href={`mailto:${professor.email}`}>
                    <Mail className="h-4 w-4" />
                    {professor.email}
                  </a>
                </Button>
              ) : (
                <div className="rounded-[1rem] border border-border bg-background-soft p-4 text-sm leading-6 text-muted-foreground">
                  No public email listed.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-paper">
            <CardHeader>
              <CardTitle>At a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div>{professor.credibilitySignal}</div>
              <div>{professor.city && professor.state ? `${professor.city}, ${professor.state}` : professor.university}</div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
