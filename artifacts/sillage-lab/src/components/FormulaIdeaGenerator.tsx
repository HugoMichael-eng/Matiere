import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "@clerk/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { IdeaDrawer } from "./IdeaDrawer";
import { useTypewriter } from "../hooks/useTypewriter";
import type { FormulaIdea, FormulaIdeaMaterial } from "../types/ideas";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const IDEA_PROMPTS = [
  "Something that smells like the last hour of summer…",
  "A woody base that feels modern, not dusty…",
  "Warmth without sweetness. Something mineral.",
  "I want it to smell like a library in winter.",
  "A clean musk that isn't obvious…",
  "The smell of cold air and warm skin.",
  "Opens green, dries down to skin and silence.",
  "A fragrance for the morning after rain.",
  "Something that makes you feel like you've just arrived somewhere good.",
];
export function FormulaIdeaGenerator({ onSelect }: { onSelect: (name: string, brief: string, materials: FormulaIdeaMaterial[]) => void }) {
  const { getToken } = useAuth();
  const [mood, setMood] = useState("");
  const [ideas, setIdeas] = useState<FormulaIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<FormulaIdea | null>(null);
  const typewriter = useTypewriter(IDEA_PROMPTS);

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const token = await getToken();
      const res = await fetch(`${basePath}/api/formulas/ideas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ mood: mood.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      setError("Couldn't reach the studio. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border border-border bg-card px-6 py-10 sm:px-10 sm:py-12"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <Sparkles size={15} className="text-muted-foreground" />
          <p className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-muted-foreground">Idea generator</p>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl leading-[.9] mb-2">Not sure where to start?</h2>
        <p className="text-muted-foreground text-sm leading-6 mb-8">Describe a feeling, a material, a mood — or leave it blank and be surprised.</p>

        {/* Input */}
        <form onSubmit={generate}>
          <div className={`flex items-center border transition-colors duration-200 ${focused ? "border-foreground/50" : "border-border"}`}>
            <input
              value={mood}
              onChange={e => setMood(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={typewriter}
              data-testid="input-idea-mood"
              className="min-w-0 flex-1 bg-transparent px-5 py-5 text-base outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="button-generate-ideas"
              className="flex h-[60px] shrink-0 items-center gap-2 border-l border-border bg-foreground px-5 font-mono-ui text-[10px] uppercase tracking-widest text-background transition-opacity disabled:opacity-50 hover:opacity-80"
            >
              {loading
                ? <span className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                : <Sparkles size={13} />}
              {loading ? "Thinking…" : "Generate"}
            </button>
          </div>
          {error && <p className="mt-3 text-xs text-muted-foreground" data-testid="status-idea-error">{error}</p>}
        </form>

        {/* Results */}
        <AnimatePresence>
          {ideas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground mb-3">Tap an idea to explore it</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {ideas.map((idea, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIdea(idea)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.09, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    data-testid={`button-idea-${i}`}
                    className="group relative border border-border bg-background p-5 text-left transition-all hover:bg-secondary/50 hover:border-foreground/30 active:scale-[.98]"
                  >
                    <p className="font-display text-2xl leading-tight pr-6">{idea.name}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-3">{idea.brief}</p>
                    {/* Arrow affordance */}
                    <ArrowRight size={13} className="absolute top-5 right-5 text-muted-foreground/40 transition-all group-hover:text-foreground/70 group-hover:translate-x-0.5" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Idea detail drawer */}
      {selectedIdea && (
        <IdeaDrawer
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onStart={(mats) => {
            onSelect(selectedIdea.name, selectedIdea.brief, mats);
            setSelectedIdea(null);
          }}
        />
      )}
    </>
  );
}

/** Match AI-suggested blueprint ingredients against the material library.
 *  Strategy: 1) case-insensitive exact, 2) substring fuzzy (either direction).
 *  Matched rows get their real materialId; unmatched stay at 0 with the AI badge. */
