import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DraftAnalysis } from "@/types";

export function PreSendChecklist({ analysis }: { analysis: DraftAnalysis | null }) {
  return (
    <Card className="bg-white/82">
      <CardHeader>
        <CardTitle>Pre-Send Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis?.preSendCheck?.length ? (
          analysis.preSendCheck.map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-border bg-background-soft p-4">
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            The final check appears here after you generate or analyze a draft.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
