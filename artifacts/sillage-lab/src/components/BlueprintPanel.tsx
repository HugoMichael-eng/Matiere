import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { FormulaIdeaMaterial } from "../types/ideas";

export function BlueprintPanel({ materials }: { materials: FormulaIdeaMaterial[] }) {
  const sorted = [...materials].sort((a, b) => {
    const order = { top: 0, heart: 1, base: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });
  const maxPct = Math.max(...sorted.map(m => m.pct), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="border border-border bg-card p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={12} className="text-muted-foreground" />
        <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground">AI blueprint — materials &amp; ratios</p>
      </div>
      <div className="space-y-4">
        {sorted.map((mat, i) => {
          const roleLabel = mat.role.charAt(0).toUpperCase() + mat.role.slice(1);
          const barWidth = `${Math.round((mat.pct / maxPct) * 100)}%`;
          const barOpacity = mat.role === "top" ? "opacity-90" : mat.role === "heart" ? "opacity-60" : "opacity-40";
          return (
            <motion.div
              key={mat.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{mat.name}</span>
                  <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{roleLabel}</span>
                </div>
                <span className="font-mono-ui text-[11px] tabular-nums text-muted-foreground">{mat.pct}%</span>
              </div>
              <div className="h-[2px] w-full bg-border">
                <motion.div
                  className={`h-full bg-foreground ${barOpacity}`}
                  initial={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Concentrate total</span>
        <span className="font-mono-ui text-[11px] tabular-nums text-muted-foreground">{sorted.reduce((s, m) => s + m.pct, 0)}%</span>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/60 leading-5">Add each material using the ingredient builder below. Match names to your library.</p>
    </motion.div>
  );
}
