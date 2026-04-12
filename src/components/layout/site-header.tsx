"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const appLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/shortlist", label: "Shortlist" },
  { href: "/drafts", label: "Drafts" },
  { href: "/profile", label: "Profile" },
];

export function SiteHeader({ appMode = false }: { appMode?: boolean }) {
  const pathname = usePathname();
  const { user, logout, continueAsDemo } = useAuth();

  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(1180px,calc(100%-1.5rem))]">
      <div className="paper-panel flex items-center justify-between gap-4 rounded-[1.6rem] px-4 py-3 sm:px-6">
        <Logo href={appMode ? "/discover" : "/"} />

        <nav className="hidden items-center gap-1 md:flex">
          {(appMode ? appLinks : [{ href: "#how-it-works", label: "How it works" }, { href: "#preview", label: "Preview" }, { href: "#why-studentreach", label: "Why it feels different" }]).map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-white/70 hover:text-foreground",
                  pathname === item.href && "bg-white text-foreground shadow-sm",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-medium text-foreground">{user.name}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {user.mode === "demo" ? "Demo Mode" : "Signed In"}
                </div>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={() => void logout()}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </>
          ) : (
            <>
              {!appMode ? (
                <>
                  <Button asChild variant="ghost" className="hidden sm:inline-flex">
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Start free</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => void continueAsDemo()}>
                    Continue in demo
                  </Button>
                  <Button asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
