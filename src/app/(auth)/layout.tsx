import { SiteHeader } from "@/components/layout/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16">
      <SiteHeader />
      <main className="mx-auto flex w-[min(1120px,calc(100%-1.5rem))] flex-col justify-center py-8 md:min-h-[calc(100vh-6rem)]">
        {children}
      </main>
    </div>
  );
}
