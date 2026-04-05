"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, ArrowUpRight } from "lucide-react";
import { ResearchTag } from "@/components/shared/research-tag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Professor } from "@/types";

export function ProfessorCard({
  professor,
  isSaved,
  onToggleSave,
}: {
  professor: Professor;
  isSaved: boolean;
  onToggleSave(): void;
}) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-[1.5rem] border border-border-strong bg-paper p-5 shadow-[0_10px_24px_rgba(18,24,38,0.05)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-[1.7rem] leading-tight tracking-[-0.03em] text-foreground">
            {professor.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {professor.title} · {professor.university}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{professor.department}</p>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-white text-muted-foreground hover:text-foreground",
            isSaved && "border-primary/30 bg-primary/10 text-primary",
          )}
          aria-label={isSaved ? "Remove from saved professors" : "Save professor"}
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {professor.researchTags.map((tag) => (
          <ResearchTag key={tag} label={tag} />
        ))}
      </div>

      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        {professor.workSummary || professor.currentFocus || professor.whyFit}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">{professor.credibilitySignal}</div>
        <Button asChild size="sm">
          <Link href={`/professors/${professor.id}`}>
            View profile
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}
