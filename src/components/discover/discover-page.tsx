"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Compass, LoaderCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AnnotationBadge } from "@/components/shared/annotation-badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessorSearch, useProfile, useShortlist, useToggleShortlist, useUniversities } from "@/hooks/use-studentreach";
import { type Field, type ProfessorTitle, type SearchParams } from "@/types";
import { ProfessorCard } from "./professor-card";
import { ResearchSearchBar } from "./research-search-bar";
import { SearchFilters } from "./search-filters";

const defaultFilters: SearchParams = {
  topic: "",
  location: "",
  radiusMiles: 250,
  field: "All",
  university: "All",
  titles: ["Professor", "Associate Professor", "Assistant Professor"],
};

export function DiscoverPage() {
  const { data: profile } = useProfile();
  const { data: shortlist = [] } = useShortlist();
  const toggleShortlist = useToggleShortlist();
  const { data: universities = [] } = useUniversities();
  const [filters, setFilters] = useState<SearchParams>(defaultFilters);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (profile && !hydrated) {
      setFilters((current) => ({
        ...current,
        topic: profile.interest,
        location: profile.location,
        radiusMiles: profile.searchRadius,
        field: profile.field,
      }));
      setHydrated(true);
    }
  }, [profile, hydrated]);

  const deferredFilters = useDeferredValue(filters);
  const searchQuery = useProfessorSearch(deferredFilters);

  const resultCountLabel = useMemo(() => {
    if (!searchQuery.data) {
      return "Loading";
    }
    return `${searchQuery.data.total} professors`;
  }, [searchQuery.data]);

  function updateFilters(patch: Partial<SearchParams>) {
    startTransition(() => {
      setFilters((current) => ({ ...current, ...patch }));
    });
  }

  function toggleTitle(title: ProfessorTitle, checked: boolean) {
    const current = filters.titles ?? [];
    updateFilters({
      titles: checked ? [...current, title] : current.filter((item) => item !== title),
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <SectionHeading
          eyebrow="Discover"
          title="Find professors worth the deeper click."
          description="Search stays fast. Heavier analysis happens once you open a profile, so you can scan broadly before spending time on details."
        />
        <div className="flex flex-wrap gap-3">
          <AnnotationBadge label={resultCountLabel} tone="green" />
          <AnnotationBadge label="Assistant professors included" tone="blue" />
        </div>
      </div>

      <ResearchSearchBar
        topic={filters.topic}
        location={filters.location}
        radiusMiles={filters.radiusMiles}
        onTopicChange={(value) => updateFilters({ topic: value })}
        onLocationChange={(value) => updateFilters({ location: value })}
        onRadiusChange={(value) => updateFilters({ radiusMiles: value })}
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <SearchFilters
            field={filters.field}
            university={filters.university}
            universities={universities}
            titles={filters.titles}
            onFieldChange={(value) => updateFilters({ field: value as Field | "All" })}
            onUniversityChange={(value) => updateFilters({ university: value })}
            onTitleChange={toggleTitle}
          />

          <div className="rounded-[1.8rem] border border-dashed border-border-strong bg-white/65 p-5 text-sm leading-6 text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Compass className="h-4 w-4 text-primary" />
              Research workflow note
            </div>
            Search results render from a fast list endpoint shape. Detail pages can afford the slower, richer analysis after you click in.
          </div>
        </div>

        <div className="space-y-4">
          {searchQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-[1.8rem] border border-border-strong bg-white/70 p-5">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="mt-3 h-4 w-56" />
                  <Skeleton className="mt-5 h-24 w-full" />
                  <Skeleton className="mt-4 h-10 w-full" />
                </div>
              ))}
            </div>
          ) : searchQuery.isError ? (
            <div className="rounded-[1.8rem] border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                Search ran into a problem
              </div>
              Please try again. The service layer is already isolated, so this is safe to swap for a real backend later.
            </div>
          ) : searchQuery.data?.results.length ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {toggleShortlist.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Scan first. Deeper summaries appear when you open a professor profile.
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {searchQuery.data.results.map((professor, index) => (
                  <motion.div
                    key={professor.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
                  >
                    <ProfessorCard
                      professor={professor}
                      isSaved={shortlist.includes(professor.id)}
                      onToggleSave={() => toggleShortlist.mutate(professor.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No professors matched yet"
              description="Try widening the radius, removing one filter, or searching by a broader topic. The mock dataset covers 50+ major universities across seven fields."
            />
          )}
        </div>
      </div>
    </div>
  );
}
