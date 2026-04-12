"use client";

import Link from "next/link";
import { ExternalLink, Mail, NotebookPen, Star } from "lucide-react";
import { AnnotationBadge } from "@/components/shared/annotation-badge";
import { ResearchTag } from "@/components/shared/research-tag";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessor, useProfessorInsights, useShortlist, useToggleShortlist } from "@/hooks/use-studentreach";
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
        <Skeleton className="h-14 w-96" />
        <Skeleton className="h-[220px] w-full rounded-[2rem]" />
        <Skeleton className="h-[320px] w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!professor) {
    return (
      <Card className="bg-white/82">
        <CardContent className="p-6 text-sm text-muted-foreground">
          We could not find that professor in the seeded dataset. Head back to discover and pick another profile.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Link href="/discover" className="font-medium text-primary">
          Discover
        </Link>
        <span>/</span>
        <span>{professor.name}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border-strong bg-white/82 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <AnnotationBadge label={professor.field} tone="blue" />
                  <AnnotationBadge label={professor.title} tone="green" />
                </div>
                <SectionHeading
                  title={professor.name}
                  description={`${professor.title} · ${professor.university} · ${professor.department}`}
                />
                <div className="flex flex-wrap gap-2">
                  {professor.researchTags.map((tag) => (
                    <ResearchTag key={tag} label={tag} />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/drafts?professor=${professor.id}`}>
                    <NotebookPen className="h-4 w-4" />
                    Draft outreach email
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => toggleShortlist.mutate(professor.id)}
                >
                  <Star className="h-4 w-4" />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
          </div>

          <Card className="bg-white/82">
            <CardHeader>
              <CardTitle>What They Actually Work On</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsQuery.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <p className="text-base leading-8 text-muted-foreground">{insightsQuery.data?.workSummary ?? professor.workSummary}</p>
              )}
            </CardContent>
          </Card>

          <ResearchBreakdownPanel items={insightsQuery.data?.researchBreakdown ?? professor.researchBreakdown} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/82">
              <CardHeader>
                <CardTitle>Why This Might Be a Fit</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {insightsQuery.data?.whyFit ?? professor.whyFit}
              </CardContent>
            </Card>

            <Card className="bg-white/82">
              <CardHeader>
                <CardTitle>Current Focus</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {insightsQuery.data?.currentFocus ?? professor.currentFocus}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/82">
            <CardHeader>
              <CardTitle>Good Talking Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(insightsQuery.data?.goodTalkingPoints ?? professor.goodTalkingPoints).map((point) => (
                <div key={point} className="rounded-[1.4rem] border border-border bg-background-soft p-4 text-sm leading-6 text-muted-foreground">
                  {point}
                </div>
              ))}
            </CardContent>
          </Card>

          <RecentPapersList papers={insightsQuery.data?.recentPapers ?? professor.recentPapers} />
        </div>

        <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Card className="bg-white/82">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/drafts?professor=${professor.id}`}>Open draft workspace</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <a href={professor.facultyPage} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Faculty page
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${professor.email}`}>
                  <Mail className="h-4 w-4" />
                  {professor.email}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-background-soft">
            <CardHeader>
              <CardTitle>Research notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="rounded-[1.4rem] border border-border bg-white/75 p-4">
                Search results load without waiting on this detail layer, which keeps discovery feeling much faster.
              </div>
              <div className="rounded-[1.4rem] border border-border bg-white/75 p-4">
                Students copy the final email and send it themselves. StudentReach does not support mass sending.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
