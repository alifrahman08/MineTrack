import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "safety";
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  description,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const getIconWrapperColor = () => {
    switch (variant) {
      case "success":
        return "bg-[#EDF7F2] text-[#287D54] border-[#CDE9DA]";
      case "warning":
        return "bg-[#FEF8ED] text-[#B87B17] border-[#FCE6BD]";
      case "destructive":
        return "bg-[#FDF2F1] text-[#C94438] border-[#F8D2CF]";
      case "info":
        return "bg-[#F1F6F9] text-[#477A9B] border-[#D0E2EC]";
      case "safety":
        return "bg-[#FDF3EC] text-[#F36B21] border-[#FCD8C1]";
      default:
        return "bg-[#F8F7F4] text-[#252A2D] border-[#E3E2DC]";
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs transition-all hover:border-[#687177]/40",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#687177] uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", getIconWrapperColor())}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-black text-[#252A2D] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[#687177]">
            {unit}
          </span>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs border-t border-[#E3E2DC] pt-2.5">
          {description && (
            <p className="text-[11px] text-[#687177] truncate">
              {description}
            </p>
          )}
          {trend && (
            <span
              className={cn(
                "ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded border",
                trend.isPositive
                  ? "text-[#287D54] bg-[#EDF7F2] border-[#CDE9DA]"
                  : "text-[#C94438] bg-[#FDF2F1] border-[#F8D2CF]"
              )}
            >
              {trend.value} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
