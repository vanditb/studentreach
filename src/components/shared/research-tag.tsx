import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ResearchTag({ label, className }: { label: string; className?: string }) {
  return (
    <Badge className={cn("rounded-full bg-white px-3 py-1.5 text-[12px] text-foreground", className)} variant="muted">
      {label}
    </Badge>
  );
}
