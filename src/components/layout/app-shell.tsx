"use client";

import { BookMarked, FilePenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const quickLinks = [
  { href: "/discover", label: "Discover", icon: BookMarked },
  { href: "/shortlist", label: "Shortlist", icon: BookMarked },
  { href: "/drafts", label: "Drafts", icon: FilePenLine },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pb-24">
      <SiteHeader appMode />
      {!user ? (
        <div className="mx-auto mt-4 w-[min(1180px,calc(100%-1.5rem))] rounded-[1.4rem] border border-dashed border-border-strong bg-white/60 px-5 py-4 text-sm text-muted-foreground">
          You can explore StudentReach right away in demo mode. Sign in later if you want to wire up Supabase auth with real credentials.
        </div>
      ) : null}
      <main className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-8">{children}</main>

      <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(92vw,420px)] items-center justify-between rounded-full border border-border-strong bg-paper-strong px-3 py-2 shadow-xl md:hidden">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium text-muted-foreground hover:bg-white hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
