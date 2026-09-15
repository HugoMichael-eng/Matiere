import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import type { FormulaIdea, FormulaIdeaMaterial } from "../types/ideas";
import { MaterialBars } from "./MaterialBars";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function IdeaDrawer({ idea, onStart, onClose }: { idea: FormulaIdea; onStart: (materials: FormulaIdeaMaterial[]) => void; onClose: () => void }) {
  const { getToken } = useAuth();
  const [materials, setMaterials] = useState<FormulaIdeaMaterial[]>([]);
  const [loadingMats, setLoadingMats] = useState(true);
  const [matsError, setMatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingMats(true);
    setMatsError(false);
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${basePath}/api/formulas/idea-materials`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({ name: idea.name, brief: idea.brief }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setMaterials(data.materials ?? []);
      } catch {
        if (!cancelled) setMatsError(true);
      } finally {
        if (!cancelled) setLoadingMats(false);
      }
    })();
    return () => { cancelled = true; };
  }, [idea.name, idea.brief]);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 38, mass: 0.9 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col overflow-hidden bg-card border-t border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-[3px] w-10 bg-border" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          {/* Eyebrow */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-muted-foreground" />
              <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground">Formula suggestion</p>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl leading-[.92]"
          >
            {idea.name}
          </motion.h2>

          {/* Brief */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className="mt-6 border-t border-border pt-5"
          >
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground mb-2">The brief</p>
            <p className="text-base leading-7">{idea.brief}</p>
          </motion.div>

          {/* Direction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.13, duration: 0.3 }}
            className="mt-5 border-t border-border pt-5"
          >
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground mb-2">Direction</p>
            <p className="text-sm leading-6 text-muted-foreground">{idea.direction}</p>
          </motion.div>

          {/* Materials — fetched on open */}
          <div className="mt-6 border-t border-border pt-5 pb-4">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-muted-foreground mb-5">Materials &amp; ratios</p>

            {loadingMats && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-3 bg-muted rounded-none" style={{ width: `${40 + i * 8}%` }} />
                      <div className="h-3 w-8 bg-muted rounded-none" />
                    </div>
                    <div className="h-[2px] w-full bg-border" />
                  </div>
                ))}
              </div>
            )}

            {!loadingMats && matsError && (
              <p className="text-xs text-muted-foreground">Couldn&apos;t load materials. Try again.</p>
            )}

            {!loadingMats && !matsError && materials.length > 0 && (
              <MaterialBars materials={materials} />
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 border-t border-border bg-card px-6 py-5 sm:px-8">
          <button
            onClick={() => onStart(materials)}
            data-testid="button-idea-start"
            className="flex w-full items-center justify-center gap-2 bg-foreground text-background py-4 font-mono-ui text-[11px] uppercase tracking-widest transition-opacity hover:opacity-80 active:opacity-70"
          >
            Start this formula
            <ArrowRight size={13} />
          </button>
          <button
            onClick={onClose}
            className="mt-3 w-full py-2 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to ideas
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
