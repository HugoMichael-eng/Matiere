export function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  const style = value === "approved" || value === "clear" || value === "within_limit"
    ? "text-muted-foreground border-l-2 pl-2 border-border"
    : value === "blocked" || value === "exceeds_limit"
      ? "text-destructive"
      : "text-accent-foreground border-l-2 pl-2 border-accent";
  return <span className={`inline-flex items-center font-mono-ui text-[9px] uppercase tracking-[.08em] ${style}`} data-testid={`status-${value}`}>{label}</span>;
}