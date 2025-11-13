"use client";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={twMerge(
        "h-12 w-full rounded-xl border border-border bg-white px-3 text-foreground placeholder:text-slate-400 focus-ring",
        "disabled:opacity-90 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
