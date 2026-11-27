import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold " +
    "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-emerald-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
        outline: "border border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800",
        ghost: "text-slate-200 hover:bg-white/10",
      },
      size: {
        default: "h-11",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
