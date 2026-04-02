import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-strong bg-paper">
        <div className="grid h-5 w-5 grid-cols-2 gap-0.5">
          <span className="rounded-sm bg-primary/95" />
          <span className="rounded-sm bg-primary/50" />
          <span className="rounded-sm bg-primary/35" />
          <span className="rounded-sm bg-primary/20" />
        </div>
      </div>
      <div className="leading-none">
        <div className="font-serif text-xl tracking-[-0.02em] text-foreground">StudentReach</div>
      </div>
    </Link>
  );
}
