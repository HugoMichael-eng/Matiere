import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-0 flex flex-col justify-between gap-4 border-b border-border pt-10 pb-7 sm:flex-row sm:items-end">
      <div>
        <p className="font-mono-ui text-[8px] uppercase tracking-[.32em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-2 font-display tracking-[-0.04em] leading-[.86] text-foreground" style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }} data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}