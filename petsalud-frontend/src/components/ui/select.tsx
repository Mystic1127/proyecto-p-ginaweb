"use client";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, Props>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={twMerge(
        "h-12 w-full rounded-xl border border-border bg-white px-3 text-foreground focus-ring",
        "disabled:opacity-90 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
