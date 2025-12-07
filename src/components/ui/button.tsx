import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline:
          "border-2 border-border bg-transparent text-foreground hover:bg-secondary hover:border-primary rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost:
          "text-foreground hover:bg-secondary hover:text-foreground rounded-xl",
        link:
          "text-primary underline-offset-4 hover:underline",
        // Hero gradient button with neon glow
        hero: "bg-gradient-primary text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] glow-cyan font-bold tracking-wide",
        // Neon outline button
        neon: "border-2 border-neon-cyan bg-transparent text-foreground hover:bg-primary/10 rounded-2xl transition-all duration-300",
        // Quick reply chip style
        chip: "bg-secondary/60 text-foreground border border-border/50 hover:border-primary hover:bg-primary/10 hover:text-primary rounded-full backdrop-blur-sm transition-all duration-200",
        // Glass button
        glass: "glass text-foreground hover:bg-card/60 rounded-xl",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        xl: "h-16 px-12 text-lg",
        icon: "h-10 w-10",
        chip: "h-9 px-4 text-sm",
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
