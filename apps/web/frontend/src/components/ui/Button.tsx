import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/libs/utils";

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 gap-1.5 px-2.5",
        icon: "size-9",
        "icon-lg": "size-10",
        "icon-sm": "size-8 rounded-[min(var(--radius-md),10px)]",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),8px)] ",
        lg: "h-10 gap-1.5 px-2.5",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs",
      },
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        destructive:
          "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 text-destructive focus-visible:border-destructive/40",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
      },
    },
  },
);

export function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}
