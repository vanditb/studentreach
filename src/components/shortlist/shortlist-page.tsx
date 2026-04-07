"use client";

import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
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
    return <Skeleton className="h-[420px] w-full rounded-[1.5rem]" />;
  }

  const shortlistIds = shortlistQuery.data ?? [];
  const savedProfessors = (professorsQuery.data?.results ?? []).filter((professor) => shortlistIds.includes(professor.id));

  if (!savedProfessors.length) {
    return (
      <EmptyState
        title="No saved professors yet"
        description="Save a few professors as you browse."
        actionHref="/discover"
        actionLabel="Go to search"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Saved"
          title="Saved professors"
          description="Come back to these later, compare them, or jump straight into an email."
        />
        <Button asChild variant="secondary">
          <Link href="/drafts">Open drafts</Link>
        </Button>
      </div>

      <div className="grid gap-4">
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
