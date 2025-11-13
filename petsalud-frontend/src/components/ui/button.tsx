"use client";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "ghost" | "link";
  size?: "sm" | "md";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, children, variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all rounded-xl focus-ring";
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-12 px-4 text-base",
    }[size];
    const variants = {
      primary:
        "bg-primary text-white hover:opacity-95 shadow-soft disabled:opacity-70 disabled:cursor-not-allowed",
      ghost:
        "bg-transparent text-foreground hover:bg-muted",
      link:
        "bg-transparent text-primary underline-offset-4 hover:underline px-0 h-auto",
    }[variant];

    return (
      <button
        ref={ref}
        className={twMerge(base, sizes, variants, className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Cargando..." : children}
      </button>
    );
  }
);
Button.displayName = "Button";
