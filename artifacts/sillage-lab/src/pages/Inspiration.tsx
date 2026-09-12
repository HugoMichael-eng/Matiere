/**
 * /projects/:id/inspiration — The Canvas
 * MATIÈRE redesign: spatial, art-director's wall.
 * Drag-and-drop moodboard feel.
 * Objects: images, text, material references, olfactive direction labels.
 * Focus mode: full-screen object viewer.
 * Board reading: AI olfactive interpretation.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  X,
  ArrowLeft,
  Sparkles,
  ZoomIn,
  Move,
  Plus,
  Minus,
  RotateCcw,
  Image as ImageIcon,
  Type,
  Layers,
} from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { InspirationItem } from "../data/projects";

// ─── Canvas object types ──────────────────────────────────────────────────────

interface CanvasObject {
  id: string;
  type: "image" | "text" | "material" | "note" | "direction" | "quote";
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  data: InspirationItem;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function deriveOlfactiveInterpretation(
  items: InspirationItem[],
  projectName: string,
  direction: string,
): string {
  const materials = items.filter((i) => i.type === "material").map((i) => i.materialName);
  const quotes = items.filter((i) => i.type === "quote").map((i) => i.body);
  const imageCount = items.filter((i) => i.type === "image").length;

  let body = `Reading the canvas for ${projectName}: the composition assembles ${imageCount} visual reference${imageCount !== 1 ? "s" : ""} with a olfactive target of "${direction}".`;

  if (materials.length > 0) {
    body += ` The material selections — ${materials.join(", ")} — anchor the palette and suggest an olfactive architecture that leans toward the structural.`;
  }

  if (quotes.length > 0) {
    const q = quotes[0];
    if (q && q.length > 0) {
      body += ` The textual reference "${q.slice(0, 80)}${q.length > 80 ? "…" : ""}" suggests the concept is oriented toward abstraction or a specific sensory quality.`;
    }
  }

  body += ` The visual register reads as ${direction.toLowerCase().includes("green") ? "botanical, wet, mineral-inflected" : direction.toLowerCase().includes("wood") ? "warm, structural, resinous" : direction.toLowerCase().includes("floral") ? "sensual, complex, multi-layered" : "atmospheric and composed"}.`;

  return body;
}

// ─── Drag hook ────────────────────────────────────────────────────────────────

function useDragObject(
  obj: CanvasObject,
  scale: number,
  onMove: (id: string, dx: number, dy: number) => void,
  onFocus: (id: string) => void,
) {
  const dragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startObj = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      dragging.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startObj.current = { x: obj.x, y: obj.y };
      onFocus(obj.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("obj-lifted");
    },
    [obj.id, obj.x, obj.y, onFocus],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const dx = (e.clientX - startPointer.current.x) / scale;
      const dy = (e.clientY - startPointer.current.y) / scale;
      onMove(obj.id, startObj.current.x + dx, startObj.current.y + dy);
    },
    [obj.id, scale, onMove],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      dragging.current = false;
      const el = e.currentTarget as HTMLElement;
      el.classList.remove("obj-lifted");
      el.classList.add("obj-settled");
      setTimeout(() => el.classList.remove("obj-settled"), 400);
    },
    [],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ─── Canvas object component ──────────────────────────────────────────────────

function CanvasObject({
  obj,
  scale,
  selected,
  onSelect,
  onMove,
  onOpenFocus,
}: {
  obj: CanvasObject;
  scale: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onOpenFocus: (item: InspirationItem) => void;
}) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDragObject(obj, scale, onMove, onSelect);

  const style: CSSProperties = {
    position: "absolute",
    left: obj.x,
    top: obj.y,
    width: obj.w,
    height: obj.type === "text" || obj.type === "note" || obj.type === "direction" ? "auto" : obj.h,
    zIndex: selected ? obj.zIndex + 50 : obj.zIndex,
    userSelect: "none",
    touchAction: "none",
  };

  const baseClass = [
    "cursor-grab active:cursor-grabbing",
    "transition-shadow duration-150",
    selected ? "ring-1 ring-accent" : "",
  ].join(" ");

  if (obj.type === "image") {
    return (
      <div
        style={style}
        className={baseClass}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <img
          src={obj.data.src}
          alt={obj.data.caption ?? ""}
          draggable={false}
          loading="lazy"
          className="w-full h-full object-cover block select-none"
          style={{ height: obj.h }}
        />
        {/* Focus button */}
        <button
          type="button"
          data-no-drag
          onClick={() => onOpenFocus(obj.data)}
          aria-label="Open full view"
          data-testid={`btn-focus-${obj.id}`}
          className="absolute top-2 right-2 h-7 w-7 bg-background/80 flex items-center justify-center opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <ZoomIn size={10} strokeWidth={1.5} />
        </button>
        {obj.data.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-white/70">{obj.data.caption}</p>
          </div>
        )}
      </div>
    );
  }

  if (obj.type === "material") {
    return (
      <div
        style={{ ...style, height: "auto" }}
        className={`${baseClass} bg-background border border-border px-3 py-3`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Material</p>
        <p className="mt-1 font-display text-base leading-tight">{obj.data.materialName}</p>
        {obj.data.body && (
          <p className="mt-1 font-mono-ui text-[7px] text-muted-foreground/70 leading-4">{obj.data.body}</p>
        )}
      </div>
    );
  }

  if (obj.type === "direction") {
    return (
      <div
        style={{ ...style, height: "auto" }}
        className={`${baseClass} bg-background/90 border-l-2 border-accent px-3 py-2`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Olfactive direction</p>
        <p className="mt-0.5 font-mono-ui text-[8px] text-foreground">{obj.data.body}</p>
      </div>
    );
  }

  // text / note / quote
  return (
    <div
      style={{ ...style, height: "auto", maxWidth: obj.w }}
      className={`${baseClass}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      data-testid={`canvas-obj-${obj.id}`}
    >
      {obj.data.type === "quote" ? (
        <p className="font-display text-xl leading-snug text-foreground italic">&ldquo;{obj.data.body}&rdquo;</p>
      ) : (
        <>
          {obj.data.tag && (
            <p className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground/60 mb-1">{obj.data.tag}</p>
          )}
          <p className="text-sm leading-6 text-foreground/80">{obj.data.body}</p>
        </>
      )}
    </div>
  );
}

// ─── Focus viewer — full-screen overlay ──────────────────────────────────────

function FocusViewer({ item, onClose }: { item: InspirationItem; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90"
      role="dialog"
      aria-modal
      aria-label="Focus view"
      onClick={onClose}
      data-testid="focus-viewer"
    >
      <button
        onClick={onClose}
        data-testid="button-close-focus"
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors focus-visible:outline-none"
        aria-label="Close focus view"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="max-h-[88dvh] max-w-5xl w-full mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "image" && (
          <img
            src={item.src}
            alt={item.caption ?? ""}
            className="max-h-[80dvh] w-full object-contain"
          />
        )}
        {item.type !== "image" && (
          <div className="bg-background p-8 max-w-2xl mx-auto">
            {item.type === "material" && (
              <>
                <p className="font-mono-ui text-[8px] uppercase tracking-[.20em] text-muted-foreground mb-3">Material</p>
                <p className="font-display text-5xl">{item.materialName}</p>
                {item.body && <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.body}</p>}
              </>
            )}
            {(item.type === "quote") && (
              <p className="font-display text-4xl leading-tight italic">&ldquo;{item.body}&rdquo;</p>
            )}
            {(item.type === "text" || item.type === "note") && (
              <>
                {item.tag && <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground mb-4">{item.tag}</p>}
                <p className="text-base leading-8">{item.body}</p>
              </>
            )}
          </div>
        )}
        {item.caption && item.type === "image" && (
          <p className="mt-3 text-center font-mono-ui text-[8px] uppercase tracking-[.14em] text-white/40">{item.caption}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Board reading panel ──────────────────────────────────────────────────────

interface BoardReadingProject {
  name: string;
  olfactiveDirection: string;
  inspiration: InspirationItem[];
}

function BoardReadingPanel({
  project,
  onClose,
}: {
  project: BoardReadingProject;
  onClose: () => void;
}) {
  const interpretation = deriveOlfactiveInterpretation(
    project.inspiration as InspirationItem[],
    project.name,
    project.olfactiveDirection,
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 top-16 z-40 w-80 bg-background border border-border flex flex-col"
      role="complementary"
      aria-label="Olfactive reading"
      data-testid="board-reading-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1 w-1 bg-accent" aria-hidden />
          <p className="font-mono-ui text-[8px] uppercase tracking-[.20em]">Olfactive reading</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close panel" data-testid="button-close-reading">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground mb-4">
          Reading · {project.name}
        </p>
        <p className="text-sm leading-7 text-foreground/80">{interpretation}</p>

        <div className="mt-6 border-t border-border pt-5">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Suggested direction</p>
          <p className="font-mono-ui text-[9px] text-foreground/70 leading-6">{project.olfactiveDirection}</p>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/50 leading-6">
            This reading is interpretive. It is derived from the canvas objects and project direction — not from formula data.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <Link
          href="/coach"
          data-testid="link-reading-to-coach"
          className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Continue with Coach →
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Object placement helpers ─────────────────────────────────────────────────

function placeObjects(items: InspirationItem[]): CanvasObject[] {
  const COLS = 3;
  const COL_W = 400;
  const GUTTERX = 48;
  const GUTTERY = 36;
  const TOP_START = 60;
  const IMAGE_H = 280;
  const MATERIAL_H = 90;
  const TEXT_H = 120;

  const cols = Array.from({ length: COLS }, () => TOP_START);

  // Jitter offsets for organic feel
  const jitter = (i: number) => (((i * 13 + 7) % 40) - 20);

  return items.map((item, i) => {
    const colIdx = i % COLS;
    const colTop = cols[colIdx] + (colIdx === 1 ? 40 : 0); // middle column offset
    const x = colIdx * (COL_W + GUTTERX) + jitter(i);
    const h = item.type === "image" ? IMAGE_H + Math.abs(jitter(i)) : item.type === "material" ? MATERIAL_H : TEXT_H;
    const y = (colTop ?? TOP_START) + jitter(i + 3);
    cols[colIdx] = (cols[colIdx] ?? TOP_START) + h + GUTTERY;

    return {
      id: item.id,
      type: item.type as CanvasObject["type"],
      x: Math.max(0, x),
      y: Math.max(0, y),
      w: item.type === "image" ? COL_W + Math.abs(jitter(i) / 2) : item.type === "text" || item.type === "quote" ? 240 + Math.abs(jitter(i)) : 220,
      h,
      zIndex: i + 1,
      data: item,
    };
  });
}

// ─── Multi-select toolbar ─────────────────────────────────────────────────────

function MultiSelectBar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="flex items-center gap-4 border border-border bg-background px-4 py-2.5">
      <span className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
        {count} selected
      </span>
      <button
        onClick={onClear}
        className="font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-clear-selection"
      >
        Clear
      </button>
    </div>
  );
}

// ─── Canvas toolbar ───────────────────────────────────────────────────────────

function CanvasToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  multiCount,
  onClearMulti,
  onToggleReading,
  showReading,
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  multiCount: number;
  onClearMulti: () => void;
  onToggleReading: () => void;
  showReading: boolean;
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 border border-border bg-background/95 px-2 py-1.5 backdrop-blur-sm">
      {multiCount > 0 ? (
        <MultiSelectBar count={multiCount} onClear={onClearMulti} />
      ) : (
        <>
          <button
            onClick={onZoomOut}
            disabled={scale <= 0.35}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Zoom out"
            data-testid="btn-canvas-zoom-out"
          >
            <Minus size={11} strokeWidth={1.5} />
          </button>
          <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground px-1 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={scale >= 2.2}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Zoom in"
            data-testid="btn-canvas-zoom-in"
          >
            <Plus size={11} strokeWidth={1.5} />
          </button>
          <div className="h-4 w-[1px] bg-border mx-1" aria-hidden />
          <button
            onClick={onReset}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Reset view"
            data-testid="btn-canvas-reset"
          >
            <RotateCcw size={11} strokeWidth={1.5} />
          </button>
          <div className="h-4 w-[1px] bg-border mx-1" aria-hidden />
          <button
            onClick={onToggleReading}
            className={[
              "flex items-center gap-1.5 h-7 px-2.5 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors",
              showReading ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            aria-label="Toggle olfactive reading"
            data-testid="btn-canvas-reading"
          >
            <span className="inline-block h-1 w-1 bg-accent" aria-hidden />
            Reading
          </button>
        </>
      )}
    </div>
  );
}

// ─── Filter legend ────────────────────────────────────────────────────────────

type FilterType = "all" | "image" | "material" | "text";

function FilterLegend({ active, onChange }: { active: FilterType; onChange: (f: FilterType) => void }) {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-0 border border-border bg-background/95">
      {(["all", "image", "material", "text"] as FilterType[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          data-testid={`filter-canvas-${f}`}
          className={[
            "px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors",
            active === f ? "text-foreground bg-secondary/50" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          aria-pressed={active === f}
        >
          {f === "text" ? "Text" : f === "material" ? "Mat." : f === "image" ? "Image" : "All"}
        </button>
      ))}
    </div>
  );
}

// ─── Main canvas ──────────────────────────────────────────────────────────────

export function Inspiration() {
  const params = useParams<{ id: string }>();
  const project = DEMO_PROJECTS.find((p) => p.id === params.id);

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [focusItem, setFocusItem] = useState<InspirationItem | null>(null);
  const [showReading, setShowReading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const [objects, setObjects] = useState<CanvasObject[]>(() => {
    if (!project) return [];
    return placeObjects(project.inspiration);
  });

  const filteredObjects = objects.filter((o) => {
    if (filter === "all") return true;
    if (filter === "image") return o.type === "image";
    if (filter === "material") return o.type === "material";
    if (filter === "text") return o.type === "text" || o.type === "note" || o.type === "quote" || o.type === "direction";
    return true;
  });

  // Pan by pointerdown on canvas (not on objects)
  const onCanvasPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-testid^='canvas-obj']")) return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setSelectedId(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onCanvasPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    setPanX((x) => x + dx);
    setPanY((y) => y + dy);
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onCanvasPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Wheel to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => clamp(s + delta, 0.35, 2.2));
  }, []);

  const handleObjectMove = useCallback((id: string, x: number, y: number) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  }, []);

  const handleObjectFocus = useCallback((id: string) => {
    setSelectedId(id);
    setObjects((prev) => {
      const maxZ = Math.max(...prev.map((o) => o.zIndex));
      return prev.map((o) => (o.id === id ? { ...o, zIndex: maxZ + 1 } : o));
    });
  }, []);

  const zoomIn = useCallback(() => setScale((s) => clamp(s + 0.12, 0.35, 2.2)), []);
  const zoomOut = useCallback(() => setScale((s) => clamp(s - 0.12, 0.35, 2.2)), []);
  const resetView = useCallback(() => { setScale(1); setPanX(0); setPanY(0); }, []);

  if (!project) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground mb-3">Not found</p>
          <Link href="/projects" className="font-mono-ui text-[9px] uppercase tracking-widest underline-offset-4 hover:underline" data-testid="link-back-projects">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ── Compact top bar ─────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border py-3 -mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${project.id}`}
            data-testid="link-back-to-project"
            className="flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={11} strokeWidth={1.5} /> {project.name}
          </Link>
          <span className="text-border/60 text-xs" aria-hidden>/</span>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-foreground">Canvas</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/50">
            {project.inspiration.length} objects
          </span>
          <button
            onClick={() => setShowReading((v) => !v)}
            data-testid="btn-toggle-reading"
            className={[
              "flex items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-[.14em] transition-colors",
              showReading ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <span className="inline-block h-1.5 w-1.5 bg-accent" aria-hidden />
            Read board
          </button>
        </div>
      </div>

      {/* ── Canvas area ─────────────────────────────── */}
      <div
        className="relative overflow-hidden canvas-surface"
        style={{
          height: "calc(100dvh - 6rem)",
          cursor: isPanning.current ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onWheel={onWheel}
        ref={canvasRef}
        data-testid="canvas"
        aria-label="Inspiration canvas"
      >
        {/* Dot grid — physical paper feel */}
        <svg
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ width: "100%", height: "100%" }}
          aria-hidden
        >
          <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="hsl(var(--muted-foreground))" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Olfactive direction label — large, subtle bg */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
          aria-hidden
        >
          <p
            className="font-display opacity-[0.04] whitespace-nowrap text-foreground select-none"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)", letterSpacing: "-0.04em" }}
          >
            {project.olfactiveDirection}
          </p>
        </div>

        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            width: "2400px",
            height: "1600px",
            willChange: "transform",
          }}
        >
          {filteredObjects.map((obj) => (
            <CanvasObject
              key={obj.id}
              obj={obj}
              scale={scale}
              selected={selectedId === obj.id}
              onSelect={handleObjectFocus}
              onMove={handleObjectMove}
              onOpenFocus={(item) => setFocusItem(item)}
            />
          ))}
        </div>

        {/* Toolbar */}
        <CanvasToolbar
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
          multiCount={multiSelected.size}
          onClearMulti={() => setMultiSelected(new Set())}
          onToggleReading={() => setShowReading((v) => !v)}
          showReading={showReading}
        />

        {/* Filter legend */}
        <FilterLegend active={filter} onChange={setFilter} />

        {/* Selection hint */}
        {selectedId && !focusItem && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() => {
                const obj = objects.find((o) => o.id === selectedId);
                if (obj) setFocusItem(obj.data);
              }}
              data-testid="btn-open-focus-selected"
              className="flex items-center gap-1.5 border border-border bg-background px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ZoomIn size={9} strokeWidth={1.5} /> Full view
            </button>
          </div>
        )}

        {/* Object count — per type */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          {[
            { icon: <ImageIcon size={10} strokeWidth={1.5} />, count: objects.filter((o) => o.type === "image").length },
            { icon: <Type size={10} strokeWidth={1.5} />, count: objects.filter((o) => o.type === "text" || o.type === "note" || o.type === "quote").length },
            { icon: <Layers size={10} strokeWidth={1.5} />, count: objects.filter((o) => o.type === "material" || o.type === "direction").length },
          ].map(({ icon, count }, i) => (
            count > 0 && (
              <div key={i} className="flex items-center gap-1 text-muted-foreground/50">
                {icon}
                <span className="font-mono-ui text-[7px]">{count}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Focus viewer */}
      <AnimatePresence>
        {focusItem && (
          <FocusViewer key="focus" item={focusItem} onClose={() => setFocusItem(null)} />
        )}
      </AnimatePresence>

      {/* Board reading panel */}
      <AnimatePresence>
        {showReading && (
          <BoardReadingPanel
            key="reading"
            project={project}
            onClose={() => setShowReading(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
