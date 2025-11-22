import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-button font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-brand-gold to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-105 hover:from-brand-gold-dark hover:to-amber-600",
        primary: "bg-gradient-to-r from-brand-gold to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-105",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:scale-105",
        outline:
          "border-2 border-gray-200 bg-white hover:border-brand-gold hover:bg-brand-gold/5 hover:text-brand-gold hover:scale-105",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-105",
        ghost: "hover:bg-gray-100 hover:text-gray-900 hover:scale-105",
        link: "text-brand-primary underline-offset-4 hover:underline hover:text-brand-blurple",
        trust: "bg-gradient-to-r from-brand-primary to-brand-blurple text-white shadow-sm hover:shadow-md hover:scale-105",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 rounded-button px-3 text-xs",
        lg: "h-11 rounded-button px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

