import { motion } from "framer-motion";
import type { FormulaIdeaMaterial } from "../types/ideas";

const ROLE_META: Record<string, { label: string; barOpacity: string; dotColor: string }> = {
  top:   { label: "Top",   barOpacity: "opacity-90", dotColor: "bg-white/80" },
  heart: { label: "Heart", barOpacity: "opacity-60", dotColor: "bg-white/55" },
  base:  { label: "Base",  barOpacity: "opacity-35", dotColor: "bg-white/35" },
};

export function MaterialBars({ materials }: { materials: FormulaIdeaMaterial[] }) {
  const sorted = [...materials].sort((a, b) => {
    const order = { top: 0, heart: 1, base: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });
  const maxPct = Math.max(...sorted.map(m => m.pct), 1);
  return (
    <div className="space-y-4">
      {sorted.map((mat, i) => {
        const meta = ROLE_META[mat.role] ?? ROLE_META.base;
        const barWidth = `${Math.round((mat.pct / maxPct) * 100)}%`;
        return (
          <motion.div
            key={mat.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-1.5 w-1.5 shrink-0 ${meta.dotColor}`} />
                <span className="text-sm">{mat.name}</span>
                <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{meta.label}</span>
              </div>
              <span className="font-mono-ui text-[11px] tabular-nums text-muted-foreground">{mat.pct}%</span>
            </div>
            <div className="h-[2px] w-full bg-border">
              <motion.div
                className={`h-full bg-foreground ${meta.barOpacity}`}
                initial={{ width: 0 }}
                animate={{ width: barWidth }}
                transition={{ delay: 0.06 + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: sorted.length * 0.07 + 0.1, duration: 0.3 }}
        className="mt-2 flex items-center justify-between border-t border-border pt-3"
      >
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Concentrate total</span>
        <span className="font-mono-ui text-[11px] tabular-nums text-muted-foreground">
          {sorted.reduce((s, m) => s + m.pct, 0)}%
        </span>
      </motion.div>
    </div>
  );
}
