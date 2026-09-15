import type { ReactNode } from "react";
import { Link } from "wouter";

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  testId,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "quiet" | "outline" | "danger";
  testId: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-80"
      : variant === "outline"
        ? "border border-foreground/20 bg-transparent text-foreground hover:border-foreground"
        : variant === "danger"
          ? "bg-destructive text-destructive-foreground hover:opacity-80"
          : "bg-transparent text-muted-foreground hover:text-foreground"
  }`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} data-testid={testId}>{children}</button>;
}