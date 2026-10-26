import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36B21] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#252A2D] text-white shadow-xs hover:bg-[#383E43]",
        destructive: "bg-[#C94438] text-white shadow-xs hover:bg-[#B53B30]",
        outline: "border border-[#E3E2DC] bg-white text-[#252A2D] shadow-xs hover:bg-[#F8F7F4] hover:border-[#687177]/50",
        secondary: "bg-[#F8F7F4] text-[#252A2D] border border-[#E3E2DC] shadow-xs hover:bg-[#EFECE6]",
        ghost: "hover:bg-[#F8F7F4] text-[#687177] hover:text-[#252A2D]",
        link: "text-[#F36B21] underline-offset-4 hover:underline",
        safety: "bg-[#F36B21] text-white shadow-xs hover:bg-[#DE5C16] font-semibold tracking-wide",
        success: "bg-[#287D54] text-white shadow-xs hover:bg-[#206845] font-semibold",
        warning: "bg-[#F3B33D] text-[#252A2D] shadow-xs hover:bg-[#E09F2B] font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
