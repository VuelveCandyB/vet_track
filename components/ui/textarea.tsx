import * as React from "react"

import { cn } from "@/lib/utils"
import { PALETTE } from "@/lib/palette"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg bg-white px-2.5 py-2 text-base transition-all outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-current focus:border-current focus:ring-2 focus:ring-offset-0",
        className
      )}
      style={{
        borderColor: PALETTE.ui.border,
        color: PALETTE.text.primary,
        border: `1px solid ${PALETTE.ui.border}`
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = PALETTE.primary.green;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${PALETTE.primary.green}20`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = PALETTE.ui.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
      {...props}
    />
  )
}

export { Textarea }
