"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ResearchTag } from "@/components/shared/research-tag";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatusChip } from "@/components/shared/status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyzeDraft, useDraft, useDrafts, useGenerateDraft, useProfessor, useSaveDraft } from "@/hooks/use-studentreach";
import { type DraftAnalysis, type DraftStatus, type DraftTone, type OutreachDraft } from "@/types";
import { DraftEditor } from "./draft-editor";
import { OutreachFeedbackPanel } from "./outreach-feedback-panel";
import { PreSendChecklist } from "./pre-send-checklist";

function deriveStatus(analysis: DraftAnalysis | null): DraftStatus {
  if (!analysis) {
    return "Draft";
  }
  const hasWarning = analysis.outreachFeedback.some((item) => item.tone === "warning");
  const needsMore = analysis.outreachFeedback.some((item) => item.tone === "suggestion");
  if (hasWarning || needsMore) {
    return "Needs Work";
  }
  return "Ready to Send";
}

export function DraftsPage() {
  const searchParams = useSearchParams();
  const professorIdFromQuery = searchParams.get("professor") ?? undefined;
  const draftIdFromQuery = searchParams.get("draft") ?? undefined;

  const draftsQuery = useDrafts();
  const selectedDraftQuery = useDraft(draftIdFromQuery);
  const selectedProfessorId = professorIdFromQuery ?? selectedDraftQuery.data?.professorId;
  const professorQuery = useProfessor(selectedProfessorId ?? "");
  const generateDraft = useGenerateDraft();
  const saveDraft = useSaveDraft();
  const analyzeDraft = useAnalyzeDraft();

  const [tone, setTone] = useState<DraftTone>("curious");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<DraftAnalysis | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showReadiness, setShowReadiness] = useState(true);

  useEffect(() => {
    const draft = selectedDraftQuery.data;
    if (!draft) {
      return;
    }
    setTone(draft.tone);
    setSubject(draft.subject);
    setContent(draft.content);
    setAnalysis(draft.analysis);
    setCurrentDraftId(draft.id);
  }, [selectedDraftQuery.data]);

  useEffect(() => {
    if (professorIdFromQuery && !draftIdFromQuery && professorQuery.data) {
      setSubject(`High school student interested in ${professorQuery.data.researchTags[0]}`);
    }
  }, [professorIdFromQuery, draftIdFromQuery, professorQuery.data]);

  const listDrafts = draftsQuery.data ?? [];
  const activeProfessor = professorQuery.data ?? null;

  const contextNotes = useMemo(
    () =>
      activeProfessor
        ? [activeProfessor.workSummary, ...activeProfessor.goodTalkingPoints].slice(0, 3)
        : [],
    [activeProfessor],
  );

  async function handleGenerate() {
    if (!activeProfessor) {
      toast.error("Select a professor first.");
      return;
    }

    const draft = await generateDraft.mutateAsync({
      professorId: activeProfessor.id,
      tone,
    });
    setTone(draft.tone);
    setSubject(draft.subject);
    setContent(draft.content);
    setAnalysis(draft.analysis);
    setCurrentDraftId(draft.id);
    toast.success("Draft generated.");
  }

  async function handleSave() {
    if (!activeProfessor) {
      toast.error("Pick a professor before saving a draft.");
      return;
    }

    const resolvedAnalysis =
      analysis ?? (content ? await analyzeDraft.mutateAsync({ content, professorId: activeProfessor.id }) : null);
    if (resolvedAnalysis) {
      setAnalysis(resolvedAnalysis);
    }

    const nextDraft: OutreachDraft = {
      id: currentDraftId ?? `draft-${Date.now()}`,
      professorId: activeProfessor.id,
      tone,
      subject,
      content,
      updatedAt: new Date().toISOString(),
      status: deriveStatus(resolvedAnalysis),
      analysis: resolvedAnalysis ?? {
        outreachFeedback: [],
        preSendCheck: [],
      },
    };

    await saveDraft.mutateAsync(nextDraft);
    setCurrentDraftId(nextDraft.id);
    toast.success("Draft saved.");
  }

  async function refreshFeedback() {
    if (!activeProfessor || !content.trim()) {
      toast.error("Write or generate a draft first.");
      return;
    }
    const nextAnalysis = await analyzeDraft.mutateAsync({ content, professorId: activeProfessor.id });
    setAnalysis(nextAnalysis);
    toast.success("Feedback refreshed.");
  }

  if (draftsQuery.isLoading) {
    return <Skeleton className="h-[520px] w-full rounded-[2rem]" />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Drafts"
        title="Write with context, then polish with a supportive review."
        description="StudentReach does not send the email for you. The goal is a better note, not a mass outreach shortcut."
      />

      {selectedProfessorId || draftIdFromQuery ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="bg-white/82">
              <CardHeader>
                <CardTitle>Selected professor context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProfessor ? (
                  <>
                    <div>
                      <div className="font-serif text-2xl text-foreground">{activeProfessor.name}</div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        {activeProfessor.title} · {activeProfessor.university}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeProfessor.researchTags.map((tag) => (
                        <ResearchTag key={tag} label={tag} />
                      ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {contextNotes.map((note) => (
                        <div key={note} className="rounded-[1.4rem] border border-border bg-background-soft p-4 text-sm leading-6 text-muted-foreground">
                          {note}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </CardContent>
            </Card>

            <DraftEditor
              professor={activeProfessor}
              tone={tone}
              subject={subject}
              content={content}
              onToneChange={setTone}
              onSubjectChange={setSubject}
              onContentChange={setContent}
              onGenerate={() => void handleGenerate()}
              onSave={() => void handleSave()}
            />
          </div>

          <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => void refreshFeedback()}>
                {analyzeDraft.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                Refresh feedback
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setShowReadiness((value) => !value)}>
                {showReadiness ? "Hide readiness" : "Show readiness"}
              </Button>
            </div>
            <OutreachFeedbackPanel analysis={analysis} />
            {showReadiness ? (
              <Card className="bg-background-soft">
                <CardHeader>
                  <CardTitle>Outreach Readiness</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {analysis?.readinessNudge ??
                    "Optional and supportive by design. If you are early, highlighting one concrete class, project, or reason you care about the topic is usually enough."}
                </CardContent>
              </Card>
            ) : null}
            <PreSendChecklist analysis={analysis} />
          </div>
        </div>
      ) : listDrafts.length ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listDrafts.map((draft) => (
              <Card key={draft.id} className="bg-white/82">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">{draft.subject}</CardTitle>
                    <StatusChip status={draft.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                  </p>
                  <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{draft.content}</p>
                  <Button asChild className="w-full">
                    <Link href={`/drafts?draft=${draft.id}`}>Open draft</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No saved drafts yet"
          description="Choose a professor from Discover or from your Shortlist, then open the draft workspace to generate and revise an outreach note."
          actionHref="/discover"
          actionLabel="Start from discover"
        />
      )}
    </div>
  );
}
