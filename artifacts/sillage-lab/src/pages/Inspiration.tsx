/**
 * /projects/:id/inspiration — The Canvas
 * MATIÈRE — art director's working wall.
 *
 * Features:
 * - Freeform drag, resize, overlap (client-side state)
 * - Stack: overlap images like physical prints, hover to fan, click to expand
 * - Interpret Stack / Selection: designed canvas result object, not a chatbot
 * - Connections: elegant thin lines between objects (acid citron nodes)
 * - Materials as canvas objects
 * - Text as editorial visual objects (not sticky notes)
 * - Focus mode: immersive double-click with olfactive translation
 * - Multi-select: floating contextual toolbar
 * - Edit / View mode
 * - Zoom / pan
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
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
  Plus,
  Minus,
  RotateCcw,
  Image as ImageIcon,
  Type,
  Layers,
  Eye,
  Pencil,
  ArrowRight,
  Maximize2,
  Move,
  Link2,
} from "lucide-react";
import { DEMO_PROJECTS } from "../data/projects";
import type { InspirationItem } from "../data/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasObject {
  id: string;
  type: "image" | "text" | "material" | "note" | "direction" | "quote" | "interpretation";
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  data: InspirationItem;
  stackedWith?: string[];   // ids of objects stacked beneath this one
  isStackTop?: boolean;
  groupId?: string;
}

interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

type FilterType = "all" | "image" | "material" | "text";
type CanvasMode = "edit" | "view";

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Derive an INTERPRET result from a set of InspirationItems
function interpretSelection(items: InspirationItem[], projectDirection: string): InspirationItem {
  const images = items.filter(i => i.type === "image");
  const materials = items.filter(i => i.type === "material");
  const allDescriptors: string[] = [];
  items.forEach(i => { if (i.descriptors) allDescriptors.push(...i.descriptors); });

  // Derive shared characters from descriptors + types
  const descriptorCounts: Record<string, number> = {};
  allDescriptors.forEach(d => { descriptorCounts[d] = (descriptorCounts[d] ?? 0) + 1; });
  const shared = Object.entries(descriptorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k.toUpperCase());

  // Derive tensions
  const hasWet = allDescriptors.some(d => ["wet", "cold", "transparent"].includes(d));
  const hasDry = allDescriptors.some(d => ["dry", "mineral", "structural"].includes(d));
  const hasSoft = allDescriptors.some(d => ["soft", "intimate", "powder"].includes(d));
  const hasHard = allDescriptors.some(d => ["metallic", "hard", "precise"].includes(d));

  const tensions: string[] = [];
  if (hasWet && hasDry) tensions.push("WET ↔ DRY");
  if (hasSoft && hasHard) tensions.push("SOFT ↔ METALLIC");
  if (images.length > 0 && materials.length > 0) tensions.push("IMAGE ↔ MATERIAL");
  if (tensions.length === 0) tensions.push("NATURAL ↔ SYNTHETIC");

  // Olfactive territory from project direction + materials
  const olfactive = projectDirection.split("·").map(s => s.trim().toUpperCase()).slice(0, 3);
  if (!olfactive.some(o => o.includes("MUSK"))) olfactive.push("MINERAL MUSK");

  // Material territory
  const materialNames = materials.map(m => m.materialName ?? "").filter(Boolean);
  const suggestedMaterials = [
    ...materialNames,
    ...(projectDirection.toLowerCase().includes("green") ? ["Stemone", "Hedione"] : []),
    ...(projectDirection.toLowerCase().includes("resin") ? ["Labdanum Absolute"] : []),
    ...(projectDirection.toLowerCase().includes("skin") ? ["Habanolide", "Ambroxan"] : []),
  ].slice(0, 4);

  const bodyLines = [
    `SHARED CHARACTER`,
    ...shared,
    ``,
    `TENSIONS`,
    ...tensions,
    ``,
    `OLFACTIVE TERRITORY`,
    ...olfactive,
    ``,
    `MATERIAL TERRITORY`,
    ...suggestedMaterials,
  ];

  return {
    id: `interp-${Date.now()}`,
    type: "interpretation",
    body: bodyLines.join("\n"),
    tag: "canvas interpretation",
    descriptors: shared.map(s => s.toLowerCase()),
  };
}

// ─── Drag hook ────────────────────────────────────────────────────────────────

function useDragObject(
  obj: CanvasObject,
  scale: number,
  editMode: boolean,
  onMove: (id: string, x: number, y: number) => void,
  onFocus: (id: string) => void,
) {
  const dragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startObj = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!editMode) return;
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      dragging.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startObj.current = { x: obj.x, y: obj.y };
      onFocus(obj.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.currentTarget.classList.add("obj-lifted");
      e.stopPropagation();
    },
    [obj.id, obj.x, obj.y, onFocus, editMode],
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

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ onResize }: { onResize: (dw: number, dh: number) => void }) {
  const startRef = useRef({ x: 0, y: 0 });
  return (
    <div
      data-no-drag
      className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1"
      onPointerDown={(e) => {
        e.stopPropagation();
        startRef.current = { x: e.clientX, y: e.clientY };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const dw = e.clientX - startRef.current.x;
        const dh = e.clientY - startRef.current.y;
        startRef.current = { x: e.clientX, y: e.clientY };
        onResize(dw, dh);
      }}
      aria-hidden
    >
      <div className="w-2 h-2 border-r border-b border-foreground/40" />
    </div>
  );
}

// ─── Connection line renderer ─────────────────────────────────────────────────

function ConnectionLines({
  connections,
  objects,
}: {
  connections: Connection[];
  objects: CanvasObject[];
}) {
  const getCenter = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return null;
    return { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
  };

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      style={{ width: "2400px", height: "1600px", zIndex: 0 }}
      aria-hidden
    >
      {connections.map(conn => {
        const from = getCenter(conn.fromId);
        const to = getCenter(conn.toId);
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <g key={conn.id}>
            <path
              d={`M ${from.x} ${from.y} Q ${mx} ${from.y} ${to.x} ${to.y}`}
              stroke="hsl(var(--border))"
              strokeWidth="0.75"
              fill="none"
              strokeDasharray="3 4"
            />
            {/* Acid citron node at midpoint */}
            <circle cx={mx} cy={(from.y + to.y) / 2} r="2.5" fill="hsl(var(--accent))" />
            <circle cx={from.x} cy={from.y} r="2" fill="hsl(var(--accent))" />
            <circle cx={to.x} cy={to.y} r="2" fill="hsl(var(--accent))" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Stack component ──────────────────────────────────────────────────────────

function StackObject({
  obj,
  stackedItems,
  scale,
  selected,
  editMode,
  onSelect,
  onMove,
  onExpandStack,
  onUnstack,
  onInterpret,
}: {
  obj: CanvasObject;
  stackedItems: CanvasObject[];
  scale: number;
  selected: boolean;
  editMode: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onExpandStack: (topId: string) => void;
  onUnstack: (topId: string) => void;
  onInterpret: (items: InspirationItem[]) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { onPointerDown, onPointerMove, onPointerUp } = useDragObject(obj, scale, editMode, onMove, onSelect);
  const allItems = [obj, ...stackedItems];

  return (
    <div
      style={{
        position: "absolute",
        left: obj.x,
        top: obj.y,
        width: obj.w,
        zIndex: selected ? obj.zIndex + 50 : obj.zIndex,
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-grab active:cursor-grabbing"
      data-testid={`canvas-stack-${obj.id}`}
    >
      {/* Stacked images — fan on hover */}
      {allItems.slice(0, 3).reverse().map((item, reverseIdx) => {
        const idx = allItems.length - 1 - reverseIdx;
        const fanAngle = hovered ? (idx - (allItems.length - 1) / 2) * 4 : 0;
        const fanY = hovered ? idx * -8 : idx * -3;
        return (
          <motion.div
            key={item.id}
            style={{
              position: idx === 0 ? "relative" : "absolute",
              top: idx === 0 ? 0 : 0,
              left: 0,
              width: "100%",
              zIndex: idx,
            }}
            animate={{
              rotate: fanAngle,
              y: fanY,
              scale: idx === allItems.length - 1 ? 1 : 0.97 - idx * 0.02,
            }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {item.type === "image" && item.data.src && (
              <img
                src={item.data.src}
                alt={item.data.caption ?? ""}
                draggable={false}
                className="w-full object-cover block select-none"
                style={{ height: obj.h, outline: selected && idx === allItems.length - 1 ? "1px solid hsl(var(--accent))" : "none" }}
              />
            )}
          </motion.div>
        );
      })}

      {/* Stack count badge */}
      <div className="absolute top-2 left-2 z-10 bg-foreground/80 text-background px-2 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest">
        {allItems.length} refs
      </div>

      {/* Contextual actions — appear on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1"
            data-no-drag
          >
            <button
              onClick={(e) => { e.stopPropagation(); onExpandStack(obj.id); }}
              className="bg-background/95 border border-border px-2.5 py-1 font-mono-ui text-[7px] uppercase tracking-widest text-foreground hover:bg-secondary transition-colors"
              data-testid={`btn-expand-stack-${obj.id}`}
            >
              Expand
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onInterpret(allItems.map(i => i.data)); }}
              className="bg-foreground/90 text-background px-2.5 py-1 font-mono-ui text-[7px] uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1"
              data-testid={`btn-interpret-stack-${obj.id}`}
            >
              <span className="inline-block h-1 w-1 bg-accent" aria-hidden /> Interpret
            </button>
            {editMode && (
              <button
                onClick={(e) => { e.stopPropagation(); onUnstack(obj.id); }}
                className="bg-background/95 border border-border px-2.5 py-1 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`btn-unstack-${obj.id}`}
              >
                Unstack
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Interpretation result object ─────────────────────────────────────────────

function InterpretationObject({
  obj,
  scale,
  selected,
  editMode,
  onSelect,
  onMove,
}: {
  obj: CanvasObject;
  scale: number;
  selected: boolean;
  editMode: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDragObject(obj, scale, editMode, onMove, onSelect);
  const lines = (obj.data.body ?? "").split("\n");

  return (
    <div
      style={{
        position: "absolute",
        left: obj.x,
        top: obj.y,
        width: obj.w,
        zIndex: selected ? obj.zIndex + 50 : obj.zIndex,
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      data-testid={`canvas-obj-${obj.id}`}
      className={`cursor-grab active:cursor-grabbing bg-foreground text-background border-l-2 border-accent px-5 py-5 ${selected ? "outline outline-1 outline-accent" : ""}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0" aria-hidden />
        <p className="font-mono-ui text-[7px] uppercase tracking-[.20em] text-background/50">Canvas interpretation</p>
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => {
          if (!line) return <div key={i} className="h-3" />;
          const isHeader = line === line.toUpperCase() && line.length > 2 && !line.includes("↔");
          const isTension = line.includes("↔");
          return (
            <p
              key={i}
              className={
                isHeader
                  ? "font-mono-ui text-[7px] uppercase tracking-[.22em] text-background/40 mt-1"
                  : isTension
                  ? "font-mono-ui text-[10px] tracking-[.06em] text-accent"
                  : "font-mono-ui text-[10px] uppercase tracking-[.08em] text-background/80"
              }
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Canvas object component ──────────────────────────────────────────────────

function CanvasObjectComp({
  obj,
  scale,
  selected,
  editMode,
  onSelect,
  onMove,
  onResize,
  onOpenFocus,
  onAddConnection,
  connectingFrom,
}: {
  obj: CanvasObject;
  scale: number;
  selected: boolean;
  editMode: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, dw: number, dh: number) => void;
  onOpenFocus: (item: InspirationItem) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  connectingFrom: string | null;
}) {
  const { onPointerDown, onPointerMove, onPointerUp } = useDragObject(obj, scale, editMode, onMove, onSelect);

  const style: CSSProperties = {
    position: "absolute",
    left: obj.x,
    top: obj.y,
    width: obj.w,
    height: obj.type === "text" || obj.type === "note" || obj.type === "direction" || obj.type === "quote" ? "auto" : obj.h,
    zIndex: selected ? obj.zIndex + 50 : obj.zIndex,
    userSelect: "none",
    touchAction: "none",
  };

  const isConnectTarget = connectingFrom && connectingFrom !== obj.id;
  const ringClass = selected
    ? "outline outline-1 outline-accent"
    : isConnectTarget
    ? "outline outline-1 outline-accent/40 cursor-crosshair"
    : "";

  const handleClick = () => {
    if (connectingFrom && connectingFrom !== obj.id) {
      onAddConnection(connectingFrom, obj.id);
    } else {
      onSelect(obj.id);
    }
  };

  if (obj.type === "image") {
    return (
      <div
        style={style}
        className={`group cursor-grab active:cursor-grabbing transition-shadow duration-150 ${ringClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <img
          src={obj.data.src}
          alt={obj.data.caption ?? ""}
          draggable={false}
          loading="lazy"
          className="w-full h-full object-cover block select-none transition-transform duration-500 group-hover:scale-[1.015]"
          style={{ height: obj.h }}
        />
        {/* Focus button */}
        <button
          type="button"
          data-no-drag
          onClick={(e) => { e.stopPropagation(); onOpenFocus(obj.data); }}
          aria-label="Open full view"
          data-testid={`btn-focus-${obj.id}`}
          className="absolute top-2 right-2 h-7 w-7 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        >
          <Maximize2 size={9} strokeWidth={1.5} />
        </button>
        {obj.data.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.10em] text-white/70">{obj.data.caption}</p>
          </div>
        )}
        {editMode && <ResizeHandle onResize={(dw, dh) => onResize(obj.id, dw, dh)} />}
      </div>
    );
  }

  if (obj.type === "material") {
    return (
      <div
        style={{ ...style, height: "auto" }}
        className={`group cursor-grab active:cursor-grabbing bg-background border border-border px-3 py-3 transition-shadow ${ringClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Material</p>
        <p className="mt-1 font-display text-base leading-tight">{obj.data.materialName}</p>
        {obj.data.materialSubtitle && (
          <p className="mt-0.5 font-mono-ui text-[7px] text-muted-foreground/70 uppercase tracking-[.10em]">{obj.data.materialSubtitle}</p>
        )}
        {obj.data.body && (
          <p className="mt-1 font-mono-ui text-[7px] text-muted-foreground/60 leading-4 max-w-[180px]">{obj.data.body}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href="/materials"
            data-testid={`btn-open-material-${obj.id}`}
            className="font-mono-ui text-[6px] uppercase tracking-widest text-muted-foreground hover:text-foreground px-1.5 py-0.5 border border-border transition-colors"
            data-no-drag
          >
            Open
          </Link>
        </div>
      </div>
    );
  }

  if (obj.type === "direction") {
    return (
      <div
        style={{ ...style, height: "auto" }}
        className={`cursor-grab active:cursor-grabbing bg-background/90 border-l-2 border-accent px-3 py-2 ${ringClass}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        data-testid={`canvas-obj-${obj.id}`}
      >
        <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground">Olfactive direction</p>
        <p className="mt-0.5 font-mono-ui text-[8px] text-foreground">{obj.data.body}</p>
      </div>
    );
  }

  // text / note / quote — editorial, not sticky notes
  const isLargeText = obj.data.tag === "direction" || obj.data.tag === "brief";
  return (
    <div
      style={{ ...style, height: "auto", maxWidth: obj.w }}
      className={`cursor-grab active:cursor-grabbing ${ringClass}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
      data-testid={`canvas-obj-${obj.id}`}
    >
      {obj.data.type === "quote" ? (
        <p className="font-display leading-snug text-foreground italic" style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}>
          &ldquo;{obj.data.body}&rdquo;
        </p>
      ) : isLargeText ? (
        <p className="font-display leading-[.9] tracking-[-0.03em] text-foreground" style={{ fontSize: "clamp(1.4rem, 3vw, 2.5rem)" }}>
          {obj.data.body}
        </p>
      ) : (
        <>
          {obj.data.tag && (
            <p className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground/60 mb-1">{obj.data.tag}</p>
          )}
          <p className="font-mono-ui text-[9px] leading-5 text-foreground/75">{obj.data.body}</p>
        </>
      )}
    </div>
  );
}

// ─── Focus viewer ─────────────────────────────────────────────────────────────

function FocusViewer({ item, projectDirection, onClose }: { item: InspirationItem; projectDirection: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Derive focus reading
  const visualReading = item.descriptors?.slice(0, 5).map(d => d.toLowerCase()) ?? ["translucent", "cold", "reflective"];
  const olfactiveTranslation = projectDirection.split("·").map(s => s.trim().toLowerCase()).slice(0, 4);
  const materialTerritory = ["Violet Leaf Absolute", "Stemone", "Hedione", "Ambroxan"].slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex bg-foreground/95"
      role="dialog"
      aria-modal
      aria-label="Focus view"
      data-testid="focus-viewer"
    >
      <button
        onClick={onClose}
        data-testid="button-close-focus"
        className="absolute top-5 right-5 p-2 text-white/40 hover:text-white/90 transition-colors focus-visible:outline-none z-10"
        aria-label="Close focus view"
      >
        <X size={16} strokeWidth={1} />
      </button>

      {/* Left — image */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 relative overflow-hidden"
        onClick={onClose}
      >
        {item.type === "image" && item.src && (
          <img
            src={item.src}
            alt={item.caption ?? ""}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {item.type !== "image" && (
          <div className="flex items-center justify-center h-full px-20">
            {item.type === "quote" && (
              <p className="font-display text-white/80 leading-snug italic" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
                &ldquo;{item.body}&rdquo;
              </p>
            )}
            {(item.type === "text" || item.type === "note") && (
              <p className="font-display text-white/80 leading-[.9] tracking-[-0.02em]" style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}>
                {item.body}
              </p>
            )}
            {item.type === "material" && (
              <p className="font-display text-white/80 leading-[.85] tracking-[-0.04em]" style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}>
                {item.materialName}
              </p>
            )}
          </div>
        )}
        {item.caption && item.type === "image" && (
          <div className="absolute bottom-0 inset-x-0 px-8 pb-8">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/30">{item.caption}</p>
          </div>
        )}
      </motion.div>

      {/* Right — interpretation panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-72 shrink-0 flex flex-col border-l border-white/10 px-8 py-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-8">
          <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
          <p className="font-mono-ui text-[7px] uppercase tracking-[.22em] text-white/30">Focus reading</p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25 mb-3">Visual reading</p>
            <div className="space-y-1">
              {visualReading.map(r => (
                <p key={r} className="font-mono-ui text-[10px] uppercase tracking-[.10em] text-white/60">{r}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25 mb-3">Olfactive translation</p>
            <div className="space-y-1">
              {olfactiveTranslation.map(r => (
                <p key={r} className="font-mono-ui text-[10px] uppercase tracking-[.10em] text-white/60">{r}</p>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono-ui text-[7px] uppercase tracking-[.18em] text-white/25 mb-3">Material territory</p>
            <div className="space-y-1">
              {materialTerritory.map(r => (
                <p key={r} className="font-mono-ui text-[10px] uppercase tracking-[.10em] text-white/60">{r}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4 pt-8">
          <button
            onClick={onClose}
            data-testid="btn-focus-return"
            className="w-full font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/40 hover:text-white/80 transition-colors text-left"
          >
            Return to canvas
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Multi-select floating toolbar ────────────────────────────────────────────

function MultiSelectToolbar({
  count,
  onGroup,
  onStack,
  onInterpret,
  onConnect,
  onClear,
}: {
  count: number;
  onGroup: () => void;
  onStack: () => void;
  onInterpret: () => void;
  onConnect: () => void;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-0 border border-border bg-background/98 backdrop-blur-sm"
      data-testid="multi-select-toolbar"
    >
      <div className="px-3 py-2 border-r border-border">
        <span className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground">{count} selected</span>
      </div>
      {[
        { label: "Group", action: onGroup, testId: "btn-multi-group" },
        { label: "Stack", action: onStack, testId: "btn-multi-stack" },
        { label: "Interpret", action: onInterpret, testId: "btn-multi-interpret", accent: true },
        { label: "Connect", action: onConnect, testId: "btn-multi-connect" },
      ].map(({ label, action, testId, accent }) => (
        <button
          key={label}
          onClick={action}
          data-testid={testId}
          className={[
            "px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors border-r border-border",
            accent ? "text-foreground hover:bg-secondary/50" : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {accent && <span className="inline-block h-1 w-1 bg-accent mr-1" aria-hidden />}
          {label}
        </button>
      ))}
      <button
        onClick={onClear}
        data-testid="btn-clear-multi"
        className="px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <X size={9} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

// ─── Object placement ─────────────────────────────────────────────────────────

function placeObjects(items: InspirationItem[]): CanvasObject[] {
  const COLS = 3;
  const COL_W = 380;
  const GUTTERX = 60;
  const GUTTERY = 40;
  const TOP_START = 60;
  const IMAGE_H = 280;
  const MATERIAL_H = 110;
  const TEXT_H = 100;

  const cols = Array.from({ length: COLS }, () => TOP_START);
  const jitter = (i: number) => (((i * 17 + 7) % 50) - 25);

  // Middle column starts lower for asymmetry
  cols[1] = TOP_START + 60;

  return items.map((item, i) => {
    const colIdx = i % COLS;
    const colTop = cols[colIdx] ?? TOP_START;
    const x = colIdx * (COL_W + GUTTERX) + jitter(i);
    const h = item.type === "image"
      ? IMAGE_H + Math.abs(jitter(i) / 2)
      : item.type === "material"
      ? MATERIAL_H
      : TEXT_H;
    const w = item.type === "image"
      ? COL_W + Math.abs(jitter(i) / 3)
      : item.type === "text" || item.type === "quote"
      ? 200 + Math.abs(jitter(i))
      : 220;
    const y = colTop + Math.abs(jitter(i + 3) / 2);
    cols[colIdx] = (cols[colIdx] ?? TOP_START) + h + GUTTERY;

    return {
      id: item.id,
      type: item.type as CanvasObject["type"],
      x: Math.max(20, x),
      y: Math.max(20, y),
      w,
      h,
      zIndex: i + 1,
      data: item,
    };
  });
}

// ─── Canvas toolbar ───────────────────────────────────────────────────────────

function CanvasToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleReading,
  showReading,
  mode,
  onToggleMode,
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleReading: () => void;
  showReading: boolean;
  mode: CanvasMode;
  onToggleMode: () => void;
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0 border border-border bg-background/97 backdrop-blur-sm">
      <button
        onClick={onZoomOut}
        disabled={scale <= 0.35}
        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 border-r border-border"
        aria-label="Zoom out"
        data-testid="btn-canvas-zoom-out"
      >
        <Minus size={10} strokeWidth={1.5} />
      </button>
      <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground px-2.5 min-w-[44px] text-center border-r border-border h-8 flex items-center">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        disabled={scale >= 2.5}
        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 border-r border-border"
        aria-label="Zoom in"
        data-testid="btn-canvas-zoom-in"
      >
        <Plus size={10} strokeWidth={1.5} />
      </button>
      <button
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors border-r border-border"
        aria-label="Reset view"
        data-testid="btn-canvas-reset"
      >
        <RotateCcw size={10} strokeWidth={1.5} />
      </button>
      <button
        onClick={onToggleReading}
        className={[
          "flex items-center gap-1.5 h-8 px-3 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors border-r border-border",
          showReading ? "text-foreground bg-secondary/40" : "text-muted-foreground hover:text-foreground",
        ].join(" ")}
        aria-label="Toggle olfactive reading"
        data-testid="btn-canvas-reading"
      >
        <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
        Read
      </button>
      <button
        onClick={onToggleMode}
        className="flex items-center gap-1.5 h-8 px-3 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors"
        aria-label={mode === "edit" ? "Switch to view mode" : "Switch to edit mode"}
        data-testid="btn-canvas-mode"
      >
        {mode === "edit" ? <Eye size={10} strokeWidth={1.5} /> : <Pencil size={10} strokeWidth={1.5} />}
        {mode === "edit" ? "View" : "Edit"}
      </button>
    </div>
  );
}

// ─── Add object toolbar (edit mode) ──────────────────────────────────────────

function AddObjectBar({
  onAddText,
  onConnectMode,
  connectMode,
}: {
  onAddText: () => void;
  onConnectMode: () => void;
  connectMode: boolean;
}) {
  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-1">
      <button
        onClick={onAddText}
        data-testid="btn-add-text"
        className="flex items-center gap-2 border border-border bg-background/95 px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Type size={9} strokeWidth={1.5} /> Text
      </button>
      <button
        onClick={onConnectMode}
        data-testid="btn-connect-mode"
        className={[
          "flex items-center gap-2 border border-border px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors",
          connectMode ? "bg-accent text-accent-foreground border-accent" : "bg-background/95 text-muted-foreground hover:text-foreground",
        ].join(" ")}
      >
        <Link2 size={9} strokeWidth={1.5} /> Connect
      </button>
    </div>
  );
}

// ─── Board reading panel ──────────────────────────────────────────────────────

function BoardReadingPanel({
  project,
  onClose,
}: {
  project: { name: string; olfactiveDirection: string; inspiration: InspirationItem[]; creativeStatement?: string; nextQuestion?: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const interpretation = useMemo(() => {
    const items = project.inspiration;
    return interpretSelection(items, project.olfactiveDirection);
  }, [project.inspiration, project.olfactiveDirection]);

  const lines = (interpretation.body ?? "").split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 top-16 z-40 w-72 bg-background border border-border flex flex-col"
      role="complementary"
      aria-label="Olfactive reading"
      data-testid="board-reading-panel"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1 w-1 bg-accent" aria-hidden />
          <p className="font-mono-ui text-[7px] uppercase tracking-[.22em]">Canvas reading</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close" data-testid="button-close-reading">
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <p className="font-mono-ui text-[6px] uppercase tracking-[.20em] text-muted-foreground mb-3">Reading · {project.name}</p>
          <div className="space-y-1">
            {lines.map((line, i) => {
              if (!line) return <div key={i} className="h-2" />;
              const isHeader = line === line.toUpperCase() && line.length > 2 && !line.includes("↔");
              const isTension = line.includes("↔");
              return (
                <p
                  key={i}
                  className={
                    isHeader
                      ? "font-mono-ui text-[6px] uppercase tracking-[.22em] text-muted-foreground mt-2"
                      : isTension
                      ? "font-mono-ui text-[9px] tracking-[.06em] text-accent"
                      : "font-mono-ui text-[9px] uppercase tracking-[.08em] text-foreground/70"
                  }
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        {project.creativeStatement && (
          <div className="border-t border-border pt-4">
            <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground mb-2">Creative statement</p>
            <p className="font-display text-lg leading-snug text-foreground/80">{project.creativeStatement}</p>
          </div>
        )}

        {project.nextQuestion && (
          <div className="border-t border-border pt-4">
            <p className="font-mono-ui text-[6px] uppercase tracking-[.18em] text-muted-foreground mb-2">Next question</p>
            <p className="text-xs leading-6 text-foreground/65 italic">&ldquo;{project.nextQuestion}&rdquo;</p>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="font-mono-ui text-[6px] uppercase tracking-[.12em] text-muted-foreground/40 leading-5">
            Interpretive · derived from canvas objects and project direction. Not from formula data.
          </p>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <Link
          href="/formulas"
          data-testid="link-reading-to-formulas"
          className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          Continue in Formula Lab <ArrowRight size={8} strokeWidth={1.5} />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Direction strip — context continuity ────────────────────────────────────

function DirectionStrip({ project }: { project: { name: string; olfactiveDirection: string; creativeStatement?: string; modCount: number } }) {
  return (
    <div className="flex items-center gap-6 border-b border-border bg-background/80 px-5 py-2 sm:px-8 lg:px-12 -mx-5 sm:-mx-8 lg:-mx-12">
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-block h-1 w-1 bg-accent shrink-0" aria-hidden />
        <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground truncate">
          {project.olfactiveDirection}
        </p>
      </div>
      {project.creativeStatement && (
        <p className="hidden sm:block font-display text-sm text-foreground/40 truncate">
          {project.creativeStatement}
        </p>
      )}
      <div className="ml-auto shrink-0 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/40">
        MOD {String(project.modCount).padStart(2, "0")}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
  const [mode, setMode] = useState<CanvasMode>("edit");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const [objects, setObjects] = useState<CanvasObject[]>(() => {
    if (!project) return [];
    return placeObjects(project.inspiration);
  });

  const filteredObjects = useMemo(() => objects.filter((o) => {
    if (filter === "all") return true;
    if (filter === "image") return o.type === "image";
    if (filter === "material") return o.type === "material";
    if (filter === "text") return ["text", "note", "quote", "direction"].includes(o.type);
    return true;
  }), [objects, filter]);

  // Identify stacks
  const stackMap = useMemo(() => {
    const m = new Map<string, string[]>();
    objects.forEach(o => {
      if (o.stackedWith && o.stackedWith.length > 0) {
        m.set(o.id, o.stackedWith);
      }
    });
    return m;
  }, [objects]);

  // Pan
  const onCanvasPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-testid^='canvas-obj']") ||
        (e.target as HTMLElement).closest("[data-testid^='canvas-stack']")) return;
    if (connectingFrom) { setConnectingFrom(null); return; }
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setSelectedId(null);
    setMultiSelected(new Set());
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [connectingFrom]);

  const onCanvasPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    setPanX((x) => x + dx);
    setPanY((y) => y + dy);
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onCanvasPointerUp = useCallback(() => { isPanning.current = false; }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => clamp(s + delta, 0.25, 2.5));
  }, []);

  const handleObjectMove = useCallback((id: string, x: number, y: number) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, x, y } : o)));
  }, []);

  const handleObjectResize = useCallback((id: string, dw: number, dh: number) => {
    setObjects((prev) => prev.map((o) =>
      o.id === id ? { ...o, w: Math.max(80, o.w + dw), h: Math.max(60, o.h + dh) } : o
    ));
  }, []);

  const handleObjectFocus = useCallback((id: string) => {
    setSelectedId(id);
    setObjects((prev) => {
      const maxZ = Math.max(...prev.map((o) => o.zIndex));
      return prev.map((o) => (o.id === id ? { ...o, zIndex: maxZ + 1 } : o));
    });
  }, []);

  // Multi-select via Shift+click — using data attribute approach
  const handleMultiSelect = useCallback((id: string) => {
    setMultiSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Stack operation
  const handleStack = useCallback(() => {
    const ids = Array.from(multiSelected);
    if (ids.length < 2) return;
    const topId = ids[ids.length - 1];
    const stackedWith = ids.slice(0, -1);
    setObjects(prev => prev.map(o => {
      if (o.id === topId) return { ...o, stackedWith, isStackTop: true };
      if (stackedWith.includes(o.id)) return { ...o, isStackTop: false };
      return o;
    }));
    setMultiSelected(new Set());
  }, [multiSelected]);

  // Unstack
  const handleUnstack = useCallback((topId: string) => {
    setObjects(prev => prev.map(o => {
      if (o.id === topId) return { ...o, stackedWith: undefined, isStackTop: false };
      return o;
    }));
  }, []);

  // Expand stack — unstack and spread
  const handleExpandStack = useCallback((topId: string) => {
    const top = objects.find(o => o.id === topId);
    if (!top || !top.stackedWith) return;
    const allIds = [topId, ...top.stackedWith];
    setObjects(prev => prev.map((o, i) => {
      const idx = allIds.indexOf(o.id);
      if (idx < 0) return o;
      return { ...o, x: top.x + idx * (top.w + 30), y: top.y, stackedWith: undefined, isStackTop: false };
    }));
  }, [objects]);

  // Interpret selection or stack
  const handleInterpret = useCallback((items: InspirationItem[]) => {
    const result = interpretSelection(items, project?.olfactiveDirection ?? "");
    const maxX = Math.max(...objects.map(o => o.x + o.w), 400);
    const maxZ = Math.max(...objects.map(o => o.zIndex), 1);
    const newObj: CanvasObject = {
      id: result.id,
      type: "interpretation",
      x: maxX + 40,
      y: 80,
      w: 260,
      h: 320,
      zIndex: maxZ + 1,
      data: result,
    };
    setObjects(prev => [...prev, newObj]);
    setMultiSelected(new Set());
  }, [objects, project?.olfactiveDirection]);

  const handleMultiInterpret = useCallback(() => {
    const ids = Array.from(multiSelected);
    const items = objects.filter(o => ids.includes(o.id)).map(o => o.data);
    handleInterpret(items);
  }, [multiSelected, objects, handleInterpret]);

  // Add text object
  const handleAddText = useCallback(() => {
    const newItem: InspirationItem = {
      id: `text-${Date.now()}`,
      type: "text",
      body: "New direction",
      tag: "direction",
    };
    const newObj: CanvasObject = {
      id: newItem.id,
      type: "text",
      x: 60 + Math.random() * 200,
      y: 60 + Math.random() * 200,
      w: 220,
      h: 80,
      zIndex: objects.length + 1,
      data: newItem,
    };
    setObjects(prev => [...prev, newObj]);
  }, [objects.length]);

  // Connect mode
  const handleConnectMode = useCallback(() => {
    if (connectingFrom) { setConnectingFrom(null); return; }
    if (selectedId) setConnectingFrom(selectedId);
  }, [connectingFrom, selectedId]);

  const handleAddConnection = useCallback((fromId: string, toId: string) => {
    setConnections(prev => {
      const exists = prev.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId));
      if (exists) return prev;
      return [...prev, { id: `conn-${Date.now()}`, fromId, toId }];
    });
    setConnectingFrom(null);
  }, []);

  const zoomIn = useCallback(() => setScale((s) => clamp(s + 0.12, 0.25, 2.5)), []);
  const zoomOut = useCallback(() => setScale((s) => clamp(s - 0.12, 0.25, 2.5)), []);
  const resetView = useCallback(() => { setScale(1); setPanX(0); setPanY(0); }, []);
  const toggleMode = useCallback(() => setMode(m => m === "edit" ? "view" : "edit"), []);

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
    <div className="animate-fade-in flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* ── Top bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border py-3 px-5 sm:px-8 lg:px-12 shrink-0 bg-background">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${project.id}`}
            data-testid="link-back-to-project"
            className="flex items-center gap-1.5 font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={10} strokeWidth={1.5} /> {project.name}
          </Link>
          <span className="text-border/50 text-xs" aria-hidden>/</span>
          <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-foreground">Canvas</p>
          {mode === "view" && (
            <span className="font-mono-ui text-[6px] uppercase tracking-[.14em] text-muted-foreground/50 border border-border px-1.5 py-0.5">
              View
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden sm:block font-mono-ui text-[7px] uppercase tracking-[.10em] text-muted-foreground/40">
            {objects.length} objects
          </span>
          <button
            onClick={() => setShowReading(v => !v)}
            data-testid="btn-toggle-reading"
            className={[
              "flex items-center gap-1.5 font-mono-ui text-[7px] uppercase tracking-[.14em] transition-colors",
              showReading ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <span className="inline-block h-1.5 w-1.5 bg-accent" aria-hidden />
            Read board
          </button>
        </div>
      </div>

      {/* ── Direction strip ───────────────────────────── */}
      <DirectionStrip project={project} />

      {/* ── Canvas area ──────────────────────────────── */}
      <div
        className="relative flex-1 overflow-hidden canvas-surface"
        style={{
          cursor: isPanning.current ? "grabbing" : connectingFrom ? "crosshair" : "grab",
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
        {/* Dot grid */}
        <svg className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ width: "100%", height: "100%" }} aria-hidden>
          <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="hsl(var(--muted-foreground))" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Large background text — project direction watermark */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none" aria-hidden>
          <p
            className="font-display opacity-[0.03] whitespace-nowrap text-foreground select-none"
            style={{ fontSize: "clamp(4rem, 12vw, 11rem)", letterSpacing: "-0.04em" }}
          >
            {project.olfactiveDirection.split("·")[0].trim()}
          </p>
        </div>

        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            width: "2600px",
            height: "1800px",
            willChange: "transform",
          }}
        >
          {/* Connection lines — behind objects */}
          <ConnectionLines connections={connections} objects={objects} />

          {/* Objects */}
          {filteredObjects.map((obj) => {
            const stacked = stackMap.get(obj.id);
            if (stacked && stacked.length > 0) {
              const stackedObjs = stacked.map(sid => objects.find(o => o.id === sid)).filter(Boolean) as CanvasObject[];
              return (
                <StackObject
                  key={obj.id}
                  obj={obj}
                  stackedItems={stackedObjs}
                  scale={scale}
                  selected={selectedId === obj.id}
                  editMode={mode === "edit"}
                  onSelect={handleObjectFocus}
                  onMove={handleObjectMove}
                  onExpandStack={handleExpandStack}
                  onUnstack={handleUnstack}
                  onInterpret={handleInterpret}
                />
              );
            }
            // Skip objects that are stacked under another
            const isUnderStack = objects.some(o => o.stackedWith?.includes(obj.id));
            if (isUnderStack) return null;

            if (obj.type === "interpretation") {
              return (
                <InterpretationObject
                  key={obj.id}
                  obj={obj}
                  scale={scale}
                  selected={selectedId === obj.id}
                  editMode={mode === "edit"}
                  onSelect={handleObjectFocus}
                  onMove={handleObjectMove}
                />
              );
            }

            return (
              <CanvasObjectComp
                key={obj.id}
                obj={obj}
                scale={scale}
                selected={selectedId === obj.id}
                editMode={mode === "edit"}
                onSelect={handleObjectFocus}
                onMove={handleObjectMove}
                onResize={handleObjectResize}
                onOpenFocus={(item) => setFocusItem(item)}
                onAddConnection={handleAddConnection}
                connectingFrom={connectingFrom}
              />
            );
          })}
        </div>

        {/* Center toolbar */}
        <CanvasToolbar
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
          onToggleReading={() => setShowReading(v => !v)}
          showReading={showReading}
          mode={mode}
          onToggleMode={toggleMode}
        />

        {/* Edit mode: add/connect bar */}
        {mode === "edit" && (
          <AddObjectBar
            onAddText={handleAddText}
            onConnectMode={handleConnectMode}
            connectMode={!!connectingFrom}
          />
        )}

        {/* Multi-select toolbar — floating, contextual */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <AnimatePresence>
            {multiSelected.size > 1 && (
              <MultiSelectToolbar
                count={multiSelected.size}
                onGroup={() => setMultiSelected(new Set())}
                onStack={handleStack}
                onInterpret={handleMultiInterpret}
                onConnect={() => {
                  const ids = Array.from(multiSelected);
                  if (ids.length >= 2) { handleAddConnection(ids[0], ids[1]); }
                }}
                onClear={() => setMultiSelected(new Set())}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Type legend */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-0 border border-border bg-background/95">
          {(["all", "image", "material", "text"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-canvas-${f}`}
              className={[
                "px-3 py-2 font-mono-ui text-[7px] uppercase tracking-[.12em] transition-colors",
                filter === f ? "text-foreground bg-secondary/50" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
              aria-pressed={filter === f}
            >
              {f === "text" ? "Text" : f === "material" ? "Mat." : f === "image" ? "Image" : "All"}
            </button>
          ))}
        </div>

        {/* Object type counts */}
        <div className="absolute top-16 right-4 z-20 flex flex-col items-end gap-1">
          {[
            { icon: <ImageIcon size={9} strokeWidth={1.5} />, count: objects.filter(o => o.type === "image").length },
            { icon: <Type size={9} strokeWidth={1.5} />, count: objects.filter(o => ["text","note","quote"].includes(o.type)).length },
            { icon: <Layers size={9} strokeWidth={1.5} />, count: objects.filter(o => ["material","direction"].includes(o.type)).length },
          ].map(({ icon, count }, i) => (
            count > 0 && (
              <div key={i} className="flex items-center gap-1 text-muted-foreground/30">
                {icon}
                <span className="font-mono-ui text-[6px]">{count}</span>
              </div>
            )
          ))}
        </div>

        {/* Connect mode hint */}
        {connectingFrom && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 border border-accent/40 bg-background/95 px-4 py-2">
            <p className="font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground">
              Click another object to connect <span className="text-accent">↔</span>
            </p>
          </div>
        )}
      </div>

      {/* Focus viewer */}
      <AnimatePresence>
        {focusItem && (
          <FocusViewer
            key="focus"
            item={focusItem}
            projectDirection={project.olfactiveDirection}
            onClose={() => setFocusItem(null)}
          />
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
