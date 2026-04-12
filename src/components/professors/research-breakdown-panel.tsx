import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ResearchBreakdownItem } from "@/types";

export function ResearchBreakdownPanel({ items }: { items: ResearchBreakdownItem[] }) {
  return (
    <Card className="bg-white/82">
      <CardHeader>
        <CardTitle>Research Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-border bg-background-soft p-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
