"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResearchSearchBar({
  topic,
  location,
  radiusMiles,
  onTopicChange,
  onLocationChange,
  onRadiusChange,
}: {
  topic: string;
  location: string;
  radiusMiles: number;
  onTopicChange(value: string): void;
  onLocationChange(value: string): void;
  onRadiusChange(value: number): void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border-strong bg-paper p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.9fr_150px_auto]">
      <div className="space-y-2">
        <label htmlFor="interest-topic" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Interest or topic
        </label>
        <Input
          id="interest-topic"
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          placeholder="e.g. trustworthy ML, microbiome, climate economics"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="location" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Location
        </label>
        <Input
          id="location"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="Boston, MA"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="radius" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Radius
        </label>
        <Input
          id="radius"
          type="number"
          min={25}
          max={3000}
          step={25}
          value={radiusMiles}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
        />
      </div>
      <div className="flex items-end">
        <Button type="button" className="w-full">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
      </div>
    </div>
  );
}
