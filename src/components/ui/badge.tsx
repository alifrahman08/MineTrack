import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#252A2D] text-white",
        secondary: "bg-[#F8F7F4] text-[#252A2D] border border-[#E3E2DC]",
        destructive: "bg-[#FDF2F1] text-[#C94438] border border-[#F8D2CF]",
        success: "bg-[#EDF7F2] text-[#287D54] border border-[#CDE9DA]",
        warning: "bg-[#FEF8ED] text-[#B87B17] border border-[#FCE6BD]",
        info: "bg-[#F1F6F9] text-[#477A9B] border border-[#D0E2EC]",
        outline: "border border-[#E3E2DC] text-[#687177] bg-white",
        safety: "bg-[#F36B21] text-white font-bold shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
