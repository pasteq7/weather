"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground disabled:pointer-events-none disabled:opacity-45 data-[state=on]:border-primary/35 data-[state=on]:bg-primary/18 data-[state=on]:text-primary aria-pressed:border-primary/35 aria-pressed:bg-primary/18 aria-pressed:text-primary aria-checked:border-primary/35 aria-checked:bg-primary/18 aria-checked:text-primary [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] outline-none transition-all aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap border border-border/35 bg-card/45",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-secondary/70 hover:text-primary",
        outline:
          "border border-input/50 bg-card/45 hover:bg-secondary/65 hover:text-primary data-[state=on]:border-primary/35 data-[state=on]:bg-primary/18 data-[state=on]:text-primary aria-pressed:bg-primary/18 aria-pressed:text-primary aria-checked:bg-primary/18 aria-checked:text-primary dark:bg-input/20 dark:hover:bg-secondary/55",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
