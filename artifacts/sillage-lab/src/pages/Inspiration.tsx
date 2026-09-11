import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import { X, Sparkles } from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { InspirationItem } from "../data/projects";

/** Derive an interpretation grounded entirely in this project's local data. */
function deriveInterpretation(project: (typeof DEMO_PROJECTS)[0]): string {
  const imageCount = project.inspiration.filter((i) => i.type === "image").length;
  const quoteCount = project.inspiration.filter((i) => i.type === "quote").length;
  const materialCount = project.inspiration.filter((i) => i.type === "material").length;
  const noteCount = project.inspiration.filter((i) => i.type === "note").length;
  const materials = project.inspiration
    .filter((i) => i.type === "material")
    .map((i) => i.materialName)
    .filter(Boolean)
    .join(", ");

  const parts: string[] = [];
  if (imageCount > 0) {
    parts.push(
      `The ${imageCount} image${imageCount !== 1 ? "s" : ""} here suggest a visual register — texture, light, and surface rather than narrative.`
    );
  }
  if (quoteCount > 0) {
    parts.push(
      `The ${quoteCount} quote${quoteCount !== 1 ? "s" : ""} introduce a linguistic frame that could anchor the olfactive brief in a mood rather than a description.`
    );
  }
  if (materialCount > 0 && materials) {
    parts.push(
      `The referenced materials (${materials}) point toward a specific structural direction — consider which of these is the anchor and which are satellites.`
    );
  }
  if (noteCount > 0) {
    parts.push(
      `The ${noteCount} note${noteCount !== 1 ? "s" : ""} suggest ongoing internal dialogue about the direction.`
    );
  }
  if (parts.length === 0) {
    return `The direction is "${project.olfactiveDirection}". The moodboard is building. One possible starting point: what single sensation defines this direction most precisely?`;
  }
  return parts.join(" ") + ` The overall direction, "${project.olfactiveDirection}", remains the coherent thread.`;
}

function InspirationCard({
  item,
  onSelect,
}: {
  item: InspirationItem;
  onSelect: (item: InspirationItem) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group cursor-pointer"
      onClick={() => onSelect(item)}
      data-testid={`card-inspiration-${item.id}`}
    >
      {item.type === "image" && item.src ? (
        <div className="overflow-hidden border border-border">
          <div className="relative overflow-hidden" style={{ paddingBottom: "75%" }}>
            <img
              src={item.src}
              alt={item.caption ?? ""}
              className="absolute inset-0 h-full w-full object-cover grayscale opacity-60 transition-all duration-500 group-hover:opacity-80 group-hover:grayscale-0"
            />
          </div>
          {item.caption && (
            <div className="px-3 py-3 border-t border-border">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground">
                {item.caption}
              </p>
            </div>
          )}
        </div>
      ) : item.type === "quote" ? (
        <div className="border border-border bg-secondary/20 p-5">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">
            Quote
          </p>
          <blockquote className="font-display text-xl leading-snug">
            &ldquo;{item.body}&rdquo;
          </blockquote>
          {item.caption && (
            <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60">
              {item.caption}
            </p>
          )}
        </div>
      ) : item.type === "material" ? (
        <div className="border border-border p-5">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">
            Material reference
          </p>
          <p className="font-mono-ui text-[11px] uppercase tracking-[.12em]">{item.materialName}</p>
          {item.body && (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
          )}
        </div>
      ) : (
        <div className="border border-border bg-secondary/10 p-5">
          {item.tag && (
            <span className="mb-3 inline-block border border-border px-2 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground">
              {item.tag}
            </span>
          )}
          <p className="text-sm leading-6 text-foreground/80">{item.body}</p>
        </div>
      )}
    </motion.div>
  );
}

function InspirationModal({
  item,
  onClose,
}: {
  item: InspirationItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-2xl w-full border border-border bg-card overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-inspiration-item"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
            {item.type}
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
            data-testid="button-close-inspiration-modal"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6">
          {item.type === "image" && item.src && (
            <img src={item.src} alt={item.caption ?? ""} className="w-full mb-4 border border-border" />
          )}
          {item.type === "quote" && item.body && (
            <blockquote className="font-display text-2xl leading-snug mb-4">
              &ldquo;{item.body}&rdquo;
            </blockquote>
          )}
          {item.type === "material" && (
            <div className="mb-4">
              <p className="font-mono-ui text-[12px] uppercase tracking-[.12em] mb-3">
                {item.materialName}
              </p>
              {item.body && (
                <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
              )}
            </div>
          )}
          {item.type === "note" && item.body && (
            <p className="text-sm leading-7 text-foreground/80 mb-4">{item.body}</p>
          )}
          {item.caption && (
            <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
              {item.caption}
            </p>
          )}
        </div>
        {item.type === "material" && item.materialName && (
          <div className="border-t border-border px-5 py-4">
            <Link
              href={`/materials?search=${encodeURIComponent(item.materialName)}`}
              className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
              data-testid="link-modal-to-material"
            >
              Search in material library →
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function Inspiration() {
  const params = useParams<{ id: string }>();
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);
  const [selected, setSelected] = useState<InspirationItem | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-4">
          Not found
        </p>
        <Link
          href="/projects"
          className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline"
          data-testid="link-back-projects"
        >
          ← Back to projects
        </Link>
      </div>
    );
  }

  const images = project.inspiration.filter((i) => i.type === "image");
  const textItems = project.inspiration.filter((i) => i.type !== "image");
  const interpretation = deriveInterpretation(project);

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        <Link
          href="/projects"
          data-testid="link-breadcrumb-projects-insp"
          className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link
          href={`/projects/${project.id}`}
          data-testid="link-breadcrumb-project-insp"
          className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-foreground">
          Inspiration
        </span>
      </div>

      {/* Header */}
      <header className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
              {project.name}
            </p>
            <h1
              className="mt-2 font-display text-5xl tracking-[-0.03em] leading-[.88] sm:text-6xl"
              data-testid="heading-inspiration"
            >
              Inspiration
            </h1>
          </div>
          <button
            onClick={() => setAiOpen((v) => !v)}
            data-testid="button-ai-interpret-moodboard"
            className="inline-flex items-center gap-2 border border-border px-3 py-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground transition-colors hover:text-foreground self-start sm:self-auto"
          >
            <Sparkles size={10} /> Interpret this direction
          </button>
        </div>
        <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/50">
          Representative moodboard · read-only · local data
        </p>
      </header>

      {/* AI panel — derived from local project data, not a backend call */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-b border-border bg-secondary/20 px-5 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-3">
                    One interpretation · derived from this moodboard
                  </p>
                  <p className="text-sm leading-7 max-w-2xl text-foreground/80">{interpretation}</p>
                  <p className="mt-3 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/50">
                    Interpretive observation · not prescriptive · based on local project data only
                  </p>
                </div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Link
                  href={`/materials?search=${encodeURIComponent(project.linkedMaterialNames[0] ?? "")}`}
                  data-testid="link-ai-material-ideas"
                  className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline"
                >
                  Explore materials →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moodboard content */}
      {project.inspiration.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border mt-8">
          <p className="font-display text-2xl text-muted-foreground/50">No references collected yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add images, quotes, material notes, and references to build the visual and sensory direction.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
              {images.map((item) => (
                <InspirationCard key={item.id} item={item} onSelect={setSelected} />
              ))}
            </div>
          )}

          {images.length > 0 && textItems.length > 0 && (
            <div className="relative flex items-center gap-4 py-6">
              <div className="h-px flex-1 bg-border" />
              <span className="shrink-0 bg-background px-3 font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">
                Text references
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {textItems.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {textItems.map((item) => (
                <InspirationCard key={item.id} item={item} onSelect={setSelected} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Olfactive direction footer */}
      <div className="mt-10 border-t border-border py-6">
        <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground mb-2">
          Olfactive direction
        </p>
        <p className="font-display text-2xl text-foreground/70 italic">
          {project.olfactiveDirection}
        </p>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <InspirationModal item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
