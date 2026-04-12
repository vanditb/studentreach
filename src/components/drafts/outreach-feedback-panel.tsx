import { AnnotationBadge } from "@/components/shared/annotation-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DraftAnalysis } from "@/types";

const toneMap = {
  good: "green",
  suggestion: "gold",
  warning: "rust",
} as const;

export function OutreachFeedbackPanel({ analysis }: { analysis: DraftAnalysis | null }) {
  return (
    <Card className="bg-white/82">
      <CardHeader>
        <CardTitle>Outreach Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis?.outreachFeedback?.length ? (
          analysis.outreachFeedback.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-border bg-background-soft p-4">
              <div className="mb-3">
                <AnnotationBadge label={item.label} tone={toneMap[item.tone]} />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Generate or analyze a draft to see where the note feels specific, too generic, or ready to tighten.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
