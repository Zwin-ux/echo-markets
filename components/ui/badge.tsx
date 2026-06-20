import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f8cff]",
  {
    variants: {
      variant: {
        default:
          "border-[#334155] bg-[#1c2633] text-[#dce3ea] hover:bg-[#223044]",
        secondary:
          "border-[#334155] bg-[#202b36] text-[#dce3ea] hover:bg-[#263445]",
        destructive:
          "border-[#7f1d1d] bg-[#3a1717] text-[#f5c7c2] hover:bg-[#431d1d]",
        outline: "border-[#334155] text-[#dce3ea]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
