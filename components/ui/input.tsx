import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[3px] border border-[#334155] bg-[#0f151d] px-3 py-2 text-base text-[#dce3ea] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#dce3ea] placeholder:text-[#738094] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f8cff] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
