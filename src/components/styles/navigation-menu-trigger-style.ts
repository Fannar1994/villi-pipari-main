import { cva } from "class-variance-authority"

export const navigationMenuTriggerStyle = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:bg-accent hover:bg-accent",
  {
    variants: {
      variant: {
        default: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)