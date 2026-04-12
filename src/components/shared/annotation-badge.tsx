import { cn } from "@/lib/utils";

export function AnnotationBadge({
  label,
  tone = "blue",
  className,
}: {
  label: string;
  tone?: "blue" | "green" | "gold" | "rust";
  className?: string;
}) {
  const tones = {
    blue: "border-primary/20 bg-primary/10 text-primary",
    green: "border-success/20 bg-success/10 text-success",
    gold: "border-gold/20 bg-gold/10 text-gold",
    rust: "border-rust/20 bg-rust/10 text-rust",
  } as const;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
        tones[tone],
        className,
      )}
    >
      {label}
    </div>
  );
}
