import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * A server component that renders a button skeleton without requiring client-side functionality.
 * This can be used within loading.tsx files as a replacement for Button.
 */
export function ButtonSkeleton({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
} & React.HTMLAttributes<HTMLDivElement>) {
  const baseClass =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    default: "bg-primary text-primary-foreground shadow",
    destructive: "bg-destructive text-destructive-foreground shadow-sm",
    outline: "border border-input bg-background shadow-sm",
    secondary: "bg-secondary text-secondary-foreground shadow-sm",
    ghost: "text-accent-foreground",
    link: "text-primary",
  };

  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-4 w-4",
  };

  return (
    <div
      className={cn(
        baseClass,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {children}
    </div>
  );
}
