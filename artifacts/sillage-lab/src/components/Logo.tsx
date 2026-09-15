import { Link } from "wouter";

export function Logo({ _light = false }: { _light?: boolean }) {
  void _light;
  return (
    <Link href="/" data-testid="link-brand" className="group">
      <span className="font-mono-ui text-[10px] font-medium tracking-[.32em] uppercase text-foreground/85 transition-opacity group-hover:opacity-60">
        MATIÈRE
      </span>
    </Link>
  );
}