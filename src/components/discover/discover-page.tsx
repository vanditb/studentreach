"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProfessorSearch,
  useProfile,
  useShortlist,
  useToggleShortlist,
  useUniversities,
} from "@/hooks/use-studentreach";
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
  const searchParams = useSearchParams();
  const { data: profile } = useProfile();
  const { data: shortlist = [] } = useShortlist();
  const toggleShortlist = useToggleShortlist();
  const { data: universities = [] } = useUniversities();
  const [filters, setFilters] = useState<SearchParams>(defaultFilters);
  const [hydrated, setHydrated] = useState(false);
  const [queryHydrated, setQueryHydrated] = useState(false);

  useEffect(() => {
    if (queryHydrated) {
      return;
    }

    const topic = searchParams.get("topic");
    const location = searchParams.get("location");
    const radius = searchParams.get("radius");

    if (!topic && !location && !radius) {
      setQueryHydrated(true);
      return;
    }

    setFilters((current) => ({
      ...current,
      topic: topic ?? current.topic,
      location: location ?? current.location,
      radiusMiles: radius ? Number(radius) || current.radiusMiles : current.radiusMiles,
    }));
    setHydrated(true);
    setQueryHydrated(true);
  }, [queryHydrated, searchParams]);

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
      return "Searching...";
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
      <div className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <SectionHeading
          eyebrow="Search"
          title="Find professors"
          description="Search by interest, location, and radius."
        />
        <div className="text-sm text-muted-foreground">{resultCountLabel}</div>
      </div>

      <ResearchSearchBar
        topic={filters.topic}
        location={filters.location}
        radiusMiles={filters.radiusMiles}
        onTopicChange={(value) => updateFilters({ topic: value })}
        onLocationChange={(value) => updateFilters({ location: value })}
        onRadiusChange={(value) => updateFilters({ radiusMiles: value })}
      />

      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
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

          <div className="rounded-[1.4rem] border border-border bg-white/55 p-4 text-sm leading-6 text-muted-foreground">
            Save professors you like, then come back later to compare them or start an email.
          </div>
        </div>

        <div className="space-y-4">
          {searchQuery.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-[1.5rem] border border-border-strong bg-paper p-5">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="mt-3 h-4 w-72" />
                  <Skeleton className="mt-5 h-20 w-full" />
                  <Skeleton className="mt-5 h-10 w-32" />
                </div>
              ))}
            </div>
          ) : searchQuery.isError ? (
            <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                Search error
              </div>
              Please try again.
            </div>
          ) : searchQuery.data?.results.length ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {toggleShortlist.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Assistant professors are included in results.
              </div>

              <div className="grid gap-4">
                {searchQuery.data.results.map((professor, index) => (
                  <motion.div
                    key={professor.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.32, ease: "easeOut" }}
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
              title="No professors found"
              description="Try a broader topic or widen the radius."
            />
          )}
        </div>
      </div>
    </div>
  );
}
