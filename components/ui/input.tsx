import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
className={cn(
  "file:text-foreground placeholder:text-muted-foreground/75 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border border-border/70 bg-card/90 px-3 py-1 text-base text-foreground transition-[color,border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  "focus-visible:border-ring/70 focus-visible:ring-ring/35 focus-visible:ring-[3px]",
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  className
)}
      {...props}
    />
  )
}

export { Input }
