import { Suspense } from "react";
import { DraftsPage } from "@/components/drafts/drafts-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function DraftsRoute() {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-[2rem]" />}>
      <DraftsPage />
    </Suspense>
  );
}
