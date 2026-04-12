import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-foreground/35 backdrop-blur-sm", className)} {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-border-strong bg-paper-strong p-6 shadow-2xl",
          className,
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-5 top-5 rounded-full border border-border bg-white/70 p-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 pr-8", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-serif text-2xl text-foreground", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger };
