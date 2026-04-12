import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Paper } from "@/types";

export function RecentPapersList({ papers }: { papers: Paper[] }) {
  return (
    <Card className="bg-white/82">
      <CardHeader>
        <CardTitle>Recent Papers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {papers.map((paper) => (
          <div key={paper.id} className="rounded-[1.4rem] border border-border bg-background-soft p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-foreground">{paper.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {paper.venue} · {paper.year}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{paper.summary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
