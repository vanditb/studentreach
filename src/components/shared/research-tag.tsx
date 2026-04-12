import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ResearchTag({ label, className }: { label: string; className?: string }) {
  return <Badge className={cn("rounded-full", className)} variant="muted">{label}</Badge>;
}
