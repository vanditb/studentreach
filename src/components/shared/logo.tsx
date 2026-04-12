import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-strong bg-white/85 shadow-sm">
        <div className="grid h-5 w-5 grid-cols-2 gap-0.5">
          <span className="rounded-sm bg-primary" />
          <span className="rounded-sm bg-accent" />
          <span className="rounded-sm bg-gold" />
          <span className="rounded-sm bg-rust" />
        </div>
      </div>
      <div className="leading-none">
        <div className="font-serif text-xl text-foreground">StudentReach</div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Research Desk</div>
      </div>
    </Link>
  );
}
