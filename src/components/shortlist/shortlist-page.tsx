"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessorSearch, useShortlist, useToggleShortlist } from "@/hooks/use-studentreach";
import { ProfessorCard } from "@/components/discover/professor-card";

export function ShortlistPage() {
  const shortlistQuery = useShortlist();
  const toggleShortlist = useToggleShortlist();
  const professorsQuery = useProfessorSearch({
    topic: "",
    location: "",
    radiusMiles: 3000,
    field: "All",
    university: "All",
    titles: ["Professor", "Associate Professor", "Assistant Professor"],
  });

  if (shortlistQuery.isLoading || professorsQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-[2rem]" />;
  }

  const shortlistIds = shortlistQuery.data ?? [];
  const savedProfessors = (professorsQuery.data?.results ?? []).filter((professor) => shortlistIds.includes(professor.id));

  if (!savedProfessors.length) {
    return (
      <EmptyState
        title="Your shortlist is still empty"
        description="Save professors as you browse to build a compare-ready list of people worth a deeper look."
        actionHref="/discover"
        actionLabel="Browse professors"
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Shortlist"
        title="Keep your best professor leads in one compare-ready stack."
        description="Each saved card keeps the essential fit reason, tags, and quick actions so you can move back into detail or drafting without redoing the research."
      />

      <Card className="bg-background-soft">
        <CardHeader>
          <CardTitle>Compare at a glance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{savedProfessors.length} saved professors</span>
          <span>·</span>
          <span>{new Set(savedProfessors.map((professor) => professor.university)).size} universities</span>
          <span>·</span>
          <Button asChild variant="ghost">
            <Link href="/drafts">Open draft workspace</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {savedProfessors.map((professor) => (
          <ProfessorCard
            key={professor.id}
            professor={professor}
            isSaved
            onToggleSave={() => toggleShortlist.mutate(professor.id)}
          />
        ))}
      </div>
    </div>
  );
}
