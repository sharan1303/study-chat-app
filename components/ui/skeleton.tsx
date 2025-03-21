import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "input" | "card" | "muted";
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        {
          "bg-muted": variant === "default" || variant === "muted",
          "bg-[hsl(var(--input))] border border-border": variant === "input",
          "bg-[hsl(var(--card))]": variant === "card",
        },
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
