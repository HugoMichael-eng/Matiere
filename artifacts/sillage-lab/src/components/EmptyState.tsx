import { Button } from "./Button";

export function EmptyState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return <div className="my-4 py-16 text-center border border-border bg-secondary/30"><p className="mt-4 font-display text-3xl">{title}</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{copy}</p><div className="mt-6"><Button href={href} variant="outline" testId="button-empty-action">{label}</Button></div></div>;
}
