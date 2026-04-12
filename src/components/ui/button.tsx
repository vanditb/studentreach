import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary px-5 py-3 text-primary-foreground shadow-[0_12px_24px_rgba(35,66,95,0.18)] hover:-translate-y-0.5 hover:bg-[#1f3850]",
        secondary:
          "border-border-strong bg-paper px-5 py-3 text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white",
        ghost: "border-transparent px-4 py-2.5 text-muted-foreground hover:bg-white/80 hover:text-foreground",
        outline:
          "border-border-strong bg-transparent px-5 py-3 text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:bg-white/75",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-6 py-3.5 text-[15px]",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
