import { Badge } from "@/components/ui/badge";
import { type DraftStatus } from "@/types";

const variants: Record<DraftStatus, "default" | "warning" | "success"> = {
  Draft: "default",
  "Needs Work": "warning",
  "Ready to Send": "success",
};

export function StatusChip({ status }: { status: DraftStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
