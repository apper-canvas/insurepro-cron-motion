import React from "react";
import { cn } from "@/utils/cn";

const Select = React.forwardRef(
  ({ className, children, error, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
          error
            ? "border-red-500 focus:border-red-500"
            : "border-slate-300 focus:border-primary-500",
          "disabled:bg-slate-100 disabled:cursor-not-allowed",
          "appearance-none bg-white",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export default Select;