import { Suspense } from "react";
import { DiscoverPage } from "@/components/discover/discover-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverRoute() {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] w-full rounded-[1.5rem]" />}>
      <DiscoverPage />
    </Suspense>
  );
}
