/**
 * Studio — creative front door.
 * Sequence: dark Current Focus hero → Projects in Motion → Inspiration preview
 *           → Recent Work → Quick Create → representative note.
 *
 * Representative project data is used for hero, projects, inspiration, and
 * recent work. Formula / material counts are removed. Real API backs formulas
 * (browsable via /formulas). One honest label at page foot.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import { DEMO_PROJECTS } from "../data/projects";

// ─── Utilities ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} />;
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Representative inspiration tiles for homepage preview ───────────────────
// Curated cross-project selection: images first, then one text + one material.
// Each tile links to its project moodboard.

interface InspirationTile {
  id: string;
  src?: string;
  text?: string;
  materialName?: string;
  materialSubtitle?: string;
  projectId: string;
  projectName: string;
  /** col-span hint: "wide" = 2 cols on desktop */
  wide?: boolean;
  /** aspect ratio for image tiles */
  aspect?: "portrait" | "landscape" | "square";
}

function buildInspirationPreview(): InspirationTile[] {
  const lv = DEMO_PROJECTS.find((p) => p.id === "proj-03")!;
  const sg = DEMO_PROJECTS.find((p) => p.id === "proj-01")!;
  const rn = DEMO_PROJECTS.find((p) => p.id === "proj-02")!;

  return [
    // Lait Vert — wet violet leaves (portrait)
    {
      id: "prev-lv-leaves",
      src: lv.coverImage, // flower.jpg
      projectId: lv.id,
      projectName: lv.name,
      aspect: "portrait",
    },
    // Sel Gris — tide pool droplets (landscape)
    {
      id: "prev-sg-drop",
      src: sg.coverImage, // hero-droplets.jpg
      projectId: sg.id,
      projectName: sg.name,
      aspect: "landscape",
    },
    // Lait Vert — mood-fresh (translucent green glass, wide)
    {
      id: "prev-lv-glass",
      src: (() => {
        const item = lv.inspiration.find((i) => i.id === "i-11k");
        return item?.src ?? lv.coverImage;
      })(),
      projectId: lv.id,
      projectName: lv.name,
      aspect: "landscape",
      wide: true,
    },
    // Lait Vert — leaves (landscape)
    {
      id: "prev-lv-leaves2",
      src: (() => {
        const item = lv.inspiration.find((i) => i.id === "i-11");
        return item?.src ?? lv.coverImage;
      })(),
      projectId: lv.id,
      projectName: lv.name,
      aspect: "landscape",
    },
    // Résine Noire — resin (square)
    {
      id: "prev-rn-resin",
      src: rn.coverImage, // resin.jpg
      projectId: rn.id,
      projectName: rn.name,
      aspect: "square",
    },
    // Lait Vert — text fragment
    {
      id: "prev-lv-text",
      text: "Not botanical. Architectural green.",
      projectId: lv.id,
      projectName: lv.name,
    },
    // Lait Vert — pale fabric / mood-clean (portrait)
    {
      id: "prev-lv-fabric",
      src: (() => {
        const item = lv.inspiration.find((i) => i.id === "i-11f");
        return item?.src ?? lv.coverImage;
      })(),
      projectId: lv.id,
      projectName: lv.name,
      aspect: "portrait",
    },
    // Lait Vert — material reference tile
    {
      id: "prev-lv-material",
      materialName: "Violet Leaf Absolute",
      materialSubtitle: "Green · wet leaf · metallic",
      projectId: lv.id,
      projectName: lv.name,
    },
  ];
}

// ─── Recent Work ──────────────────────────────────────────────────────────────

type WorkType = "MOD" | "EVALUATION" | "INSPIRATION" | "MATERIAL";

interface WorkItem {
  id: string;
  type: WorkType;
  title: string;
  subtitle: string;
  date: string;
  href: string;
}

function buildRecentWork(): WorkItem[] {
  const items: WorkItem[] = [];

  for (const p of DEMO_PROJECTS) {
    if (p.modCount > 0) {
      items.push({
        id: `mod-${p.id}`,
        type: "MOD",
        title: `MOD ${String(p.modCount).padStart(2, "0")}`,
        subtitle: p.name,
        date: p.updatedAt,
        href: `/projects/${p.id}`,
      });
    }
    if (p.evaluations[0]) {
      const ev = p.evaluations[0];
      items.push({
        id: `eval-${ev.id}`,
        type: "EVALUATION",
        title: ev.modLabel,
        subtitle: p.name,
        date: ev.date,
        href: `/projects/${p.id}`,
      });
    }
    if (p.inspiration.filter((i) => i.type === "image").length > 0) {
      items.push({
        id: `insp-${p.id}`,
        type: "INSPIRATION",
        title: p.name,
        subtitle: `${p.inspiration.length} references`,
        date: p.createdAt,
        href: `/projects/${p.id}/inspiration`,
      });
    }
    const matNote = p.notes.find((n) => n.tag === "material direction" || n.tag === "direction");
    if (matNote && p.linkedMaterialNames[0]) {
      items.push({
        id: `mat-${p.id}`,
        type: "MATERIAL",
        title: p.linkedMaterialNames[0],
        subtitle: "Note updated",
        date: matNote.createdAt,
        href: `/materials`,
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Full-bleed tappable row shared by Projects in Motion and Recent Work */
const rowCls = [
  "group flex min-w-0 items-start gap-5",
  "border-t border-border py-4 sm:py-5",
  "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
  "transition-colors duration-150",
  "hover:bg-secondary/20 focus-visible:outline-none focus-visible:bg-secondary/25",
  "active:bg-secondary/35",
].join(" ");

function ProjectRow({
  project,
  index,
}: {
  project: (typeof DEMO_PROJECTS)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.05 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        data-testid={`link-studio-project-${project.id}`}
        className={rowCls}
      >
        {/* Name + direction */}
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-tight text-foreground">
            {project.name}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {project.olfactiveDirection}
          </p>
          <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground/50">
            MOD {String(project.modCount).padStart(2, "0")} · {relativeDate(project.updatedAt)}
          </p>
        </div>
        {/* Status + arrow */}
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <span className="font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/40 hidden sm:block">
            {project.status}
          </span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground/50"
          />
        </div>
      </Link>
    </motion.div>
  );
}

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.06 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={item.href}
        data-testid={`link-recent-work-${item.id}`}
        className={rowCls}
      >
        {/* Type label column — fixed width, mono, vertically centred */}
        <div className="shrink-0 w-24 pt-0.5 hidden sm:block">
          <span className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground/50">
            {item.type}
          </span>
        </div>
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* On mobile show type inline */}
          <p className="sm:hidden font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/50 mb-0.5">
            {item.type}
          </p>
          <p className="text-sm leading-snug text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
        </div>
        {/* Date + arrow */}
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <span className="font-mono-ui text-[8px] text-muted-foreground/50">
            {relativeDate(item.date)}
          </span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground/50"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Inspiration preview grid ─────────────────────────────────────────────────

/**
 * CSS column-count masonry. 2 cols mobile, 4 cols ≥1024px.
 * "wide" tiles break to full-width via columnSpan:"all".
 * Images are rendered without visible borders — just the raw crop.
 */
function InspirationPreview({ tiles }: { tiles: InspirationTile[] }) {
  return (
    <div className="mt-4 w-full overflow-hidden">
      <style>{`
        @media (min-width: 768px) { .studio-insp { column-count: 3; column-gap: 5px; } }
        @media (min-width: 1024px) { .studio-insp { column-count: 4; column-gap: 6px; } }
      `}</style>
      <div className="studio-insp" style={{ columnCount: 2, columnGap: "4px" }}>
        {tiles.map((tile) => {
          const isWide = tile.wide;
          return (
            <div
              key={tile.id}
              style={{
                breakInside: "avoid",
                marginBottom: "4px",
                ...(isWide ? { columnSpan: "all" } : {}),
              }}
            >
              <Link
                href={`/projects/${tile.projectId}/inspiration`}
                data-testid={`link-insp-preview-${tile.id}`}
                className="group relative block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                aria-label={`Open ${tile.projectName} moodboard`}
              >
                {/* Image tile */}
                {tile.src && (
                  <div
                    className={[
                      "relative overflow-hidden w-full",
                      tile.wide
                        ? "aspect-[21/8]"
                        : tile.aspect === "portrait"
                        ? "aspect-[3/4]"
                        : tile.aspect === "square"
                        ? "aspect-square"
                        : "aspect-[4/3]",
                    ].join(" ")}
                  >
                    <img
                      src={tile.src}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {/* Project label — bottom, appears on hover */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-foreground/70 px-2.5 py-1.5">
                      <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-white/80 truncate">
                        {tile.projectName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Text tile */}
                {tile.text && (
                  <div className="flex min-h-[80px] sm:min-h-[100px] items-center justify-center bg-secondary/40 px-4 py-5 border-l-2 border-foreground/10 group-hover:border-foreground/30 transition-colors duration-150">
                    <p className="font-display text-base sm:text-lg leading-snug text-center text-foreground/70 group-hover:text-foreground transition-colors duration-150">
                      {tile.text}
                    </p>
                  </div>
                )}

                {/* Material tile */}
                {tile.materialName && (
                  <div className="flex min-h-[80px] sm:min-h-[100px] flex-col justify-between bg-card border border-border px-4 py-4 group-hover:bg-secondary/20 transition-colors duration-150">
                    <p className="font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/60">
                      Material
                    </p>
                    <div>
                      <p className="font-display text-base leading-tight mt-1">{tile.materialName}</p>
                      {tile.materialSubtitle && (
                        <p className="mt-1 font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground">
                          {tile.materialSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Force Lait Vert as the current focus project (per brief)
const FOCUS_PROJECT_ID = "proj-03";

export function Studio() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  }, []);

  // Hero: forced Lait Vert
  const focusProject =
    DEMO_PROJECTS.find((p) => p.id === FOCUS_PROJECT_ID) ?? DEMO_PROJECTS[0];

  // Projects in Motion: active projects, hero first, capped at 4
  const activeProjects = DEMO_PROJECTS.filter((p) => p.status === "active")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  // Inspiration preview tiles
  const inspirationTiles = useMemo(() => buildInspirationPreview(), []);

  // Recent Work
  const recentWork = useMemo(() => buildRecentWork(), []);

  // Real API formulas — appended to Recent Work if list is thin
  const recentFormulas = (formulasQuery.data ?? summaryQuery.data?.recentFormulas ?? []).slice(0, 3);

  // Loading: show skeleton during initial summary load
  if (summaryQuery.isLoading) {
    return (
      <div className="animate-fade-in overflow-x-hidden">
        <div className="-mx-5 sm:-mx-8 lg:-mx-12 bg-foreground px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="mt-5 h-14 w-2/3 bg-white/10" />
          <Skeleton className="mt-6 h-4 w-1/2 bg-white/10" />
          <Skeleton className="mt-10 h-5 w-1/4 bg-white/10" />
        </div>
        <div className="mt-10 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-x-hidden">

      {/* ── A. CURRENT FOCUS — dark hero ─────────────────────────────── */}
      <motion.section
        data-testid="studio-hero"
        className={[
          "-mx-5 sm:-mx-8 lg:-mx-12",
          "relative overflow-hidden",
          "bg-foreground",
          "px-5 py-14 sm:px-8 sm:py-16 lg:px-12",
        ].join(" ")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Subtle background texture — Lait Vert inspiration image, very low opacity */}
        <img
          src={focusProject.inspiration.find((i) => i.id === "i-11")?.src ?? focusProject.coverImage}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06] mix-blend-luminosity"
        />

        {/* Greeting */}
        <motion.p
          className="relative font-mono-ui text-[9px] uppercase tracking-[.36em] text-white/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {greeting}
        </motion.p>

        {/* "Current Focus" label */}
        <motion.p
          className="relative mt-8 font-mono-ui text-[8px] uppercase tracking-[.3em] text-white/25"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12 }}
        >
          Current focus
        </motion.p>

        {/* Hero content block */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Project name */}
          <h1
            data-testid="heading-studio"
            className="mt-3 font-display leading-[.86] tracking-[-0.03em] text-white break-words"
            style={{ fontSize: "clamp(2.4rem, 7vw, 5.5rem)" }}
          >
            {focusProject.name}
          </h1>

          {/* Olfactive direction — mono, restrained */}
          <p className="mt-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/40 max-w-lg">
            {focusProject.olfactiveDirection}
          </p>

          {/* Description — editorial, max 2 lines on desktop */}
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45 line-clamp-2 sm:line-clamp-none">
            {focusProject.description}
          </p>

          {/* Mod metadata */}
          <p className="mt-5 font-mono-ui text-[8px] uppercase tracking-[.22em] text-white/25">
            MOD {String(focusProject.modCount).padStart(2, "0")} · {focusProject.status} · {relativeDate(focusProject.updatedAt)}
          </p>

          {/* CTA */}
          <Link
            href={`/projects/${focusProject.id}`}
            data-testid="link-studio-continue"
            className="group mt-7 inline-flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.24em] text-white/50 transition-all duration-200 hover:text-white hover:gap-4 focus-visible:outline-none focus-visible:text-white"
          >
            Continue project
            <ArrowRight
              size={12}
              strokeWidth={1.5}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </motion.section>

      {/* ── B. PROJECTS IN MOTION ─────────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        data-testid="section-projects-in-motion"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
            Projects in motion
          </p>
          <Link
            href="/projects"
            data-testid="link-studio-view-projects"
            className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            View all projects →
          </Link>
        </div>

        {activeProjects.length > 0 ? (
          activeProjects.map((p, i) => (
            <ProjectRow key={p.id} project={p} index={i} />
          ))
        ) : (
          <div className="border-t border-border py-8">
            <p className="text-sm text-muted-foreground">No active projects.</p>
          </div>
        )}
      </motion.section>

      {/* ── C. INSPIRATION PREVIEW ───────────────────────────────────── */}
      <motion.section
        className="pt-10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        data-testid="section-inspiration-preview"
      >
        <div className="flex items-center justify-between mb-0">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
            Inspiration
          </p>
          <Link
            href={`/projects/${focusProject.id}/inspiration`}
            data-testid="link-studio-moodboards"
            className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            Open moodboards →
          </Link>
        </div>

        {/* Masonry composition */}
        <InspirationPreview tiles={inspirationTiles} />
      </motion.section>

      {/* ── D. RECENT WORK ───────────────────────────────────────────── */}
      <motion.section
        className="pt-12 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.34 }}
        data-testid="section-recent-work"
      >
        <div className="mb-1">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
            Recent work
          </p>
        </div>

        {/* Representative work items */}
        {recentWork.map((item, i) => (
          <WorkRow key={item.id} item={item} index={i} />
        ))}

        {/* Pad with real formula rows if representative list is thin */}
        {recentWork.length < 3 &&
          recentFormulas.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: 0.08 + i * 0.04 }}
            >
              <Link
                href={`/formulas/${f.id}`}
                data-testid={`link-recent-formula-${f.id}`}
                className={rowCls}
              >
                <div className="shrink-0 w-24 pt-0.5 hidden sm:block">
                  <span className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground/50">
                    Formula
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="sm:hidden font-mono-ui text-[7px] uppercase tracking-[.16em] text-muted-foreground/50 mb-0.5">
                    Formula
                  </p>
                  <p className="text-sm text-foreground truncate">{f.name || "Untitled"}</p>
                  {f.brief && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{f.brief}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 pt-0.5">
                  <span className="font-mono-ui text-[8px] text-muted-foreground/50">
                    {relativeDate(f.updatedAt)}
                  </span>
                  <ArrowRight
                    size={11}
                    strokeWidth={1.5}
                    className="text-muted-foreground/25 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/50"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.section>

      {/* ── E. QUICK CREATE ──────────────────────────────────────────── */}
      <motion.section
        className="border-t border-border mt-10 pt-8 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        data-testid="section-quick-create"
      >
        <p className="mb-5 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
          Quick create
        </p>

        {/* Restrained text actions — no large buttons */}
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {/* Functional */}
          <Link
            href="/formulas/new"
            data-testid="link-qc-formula"
            className="group inline-flex items-center gap-2 text-sm text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            New formula
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/materials"
            data-testid="link-qc-materials"
            className="group inline-flex items-center gap-2 text-sm text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            Browse materials
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/files"
            data-testid="link-qc-import"
            className="group inline-flex items-center gap-2 text-sm text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            Import file
            <ArrowRight size={10} strokeWidth={1.5} className="text-muted-foreground/35 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Representative / preview only */}
          <span
            data-testid="link-qc-project"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/35 cursor-default select-none"
            aria-disabled="true"
            title="Not yet available — no backend Project entity"
          >
            New project
            <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/25">
              Preview
            </span>
          </span>
          <span
            data-testid="link-qc-inspiration"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/35 cursor-default select-none"
            aria-disabled="true"
            title="Not yet available — representative board"
          >
            Add inspiration
            <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/25">
              Preview
            </span>
          </span>
          <span
            data-testid="link-qc-note"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/35 cursor-default select-none"
            aria-disabled="true"
            title="Not yet available — representative notes"
          >
            New note
            <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/25">
              Preview
            </span>
          </span>
        </div>
      </motion.section>

      {/* ── Representative honesty note ───────────────────────────────── */}
      <div className="border-t border-border/40 pb-10">
        <p className="pt-4 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/30 leading-5">
          Project, inspiration and note data is representative — local demo workspace only.
          Formula and material data is live from your account.
        </p>
      </div>

    </div>
  );
}
