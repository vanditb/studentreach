import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-3", className)}>
      {eyebrow ? (
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</div>
      ) : null}
      <h2 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">{title}</h2>
      {description ? <p className="text-base leading-7 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
