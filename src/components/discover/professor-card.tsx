"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, ExternalLink, GraduationCap } from "lucide-react";
import { ResearchTag } from "@/components/shared/research-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <Card className="h-full bg-white/82">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>{professor.name}</CardTitle>
              <div className="text-sm leading-6 text-muted-foreground">
                {professor.title} · {professor.university}
                <br />
                {professor.department}
              </div>
            </div>
            <div className="rounded-full border border-border-strong bg-background-soft px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {professor.recentPublicationCount} recent papers
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {professor.researchTags.map((tag) => (
              <ResearchTag key={tag} label={tag} />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-[1.4rem] border border-success/20 bg-success/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-success">
              <GraduationCap className="h-4 w-4" />
              Why This Might Be a Fit
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{professor.whyFit}</p>
          </div>
          <div className="text-sm text-muted-foreground">{professor.credibilitySignal}</div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3">
          <Button asChild className="flex-1">
            <Link href={`/professors/${professor.id}`}>
              View Profile
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" className={cn("flex-1", isSaved && "border-primary/35 bg-primary/8 text-primary")} onClick={onToggleSave}>
            <Bookmark className="h-4 w-4" />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
