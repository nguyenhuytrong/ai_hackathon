import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ActionLink({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary/25",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-white text-foreground hover:border-primary/40 hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}
