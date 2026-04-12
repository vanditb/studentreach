import Link from "next/link";
import { BookOpenText, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="border-dashed bg-white/70">
      <CardHeader>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-strong bg-secondary">
          <Compass className="h-5 w-5 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
        {actionHref && actionLabel ? (
          <Button asChild>
            <Link href={actionHref}>
              <BookOpenText className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
