import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border transition-all duration-200 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
          "bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "selection:bg-indigo-100 dark:selection:bg-indigo-900/50 selection:text-indigo-900 dark:selection:text-indigo-100",
          hasError 
            ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]" 
            : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] dark:focus:shadow-[0_0_0_3px_rgba(129,140,248,0.15)]",
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
