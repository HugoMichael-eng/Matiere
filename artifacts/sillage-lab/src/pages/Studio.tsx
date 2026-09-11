/**
 * Studio — the front door into the creative practice.
 * Hierarchy: Continue Working (hero) → Active Projects → Recent Work → Quick Create.
 * Library metrics removed; representative workspace data labeled once at page level.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useGetDashboardSummary, useListFormulas } from "@workspace/api-client-react";
import { DEMO_PROJECTS } from "../data/projects";

// ─── Utilities ────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-none bg-muted ${className}`} />;
}

function relativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Representative recent work items ────────────────────────────────────────
// These are derived from local project data — varied creative objects to
// illustrate the breadth of the workspace (mods, evaluations, inspiration,
// material notes). Labeled once at page level as representative.

interface WorkItem {
  id: string;
  type: "mod" | "evaluation" | "inspiration" | "material-note";
  label: string;
  detail: string;
  projectName: string;
  date: string;
  href: string;
}

function buildRecentWork(): WorkItem[] {
  const items: WorkItem[] = [];

  for (const p of DEMO_PROJECTS) {
    // Latest mod
    if (p.modCount > 0) {
      items.push({
        id: `mod-${p.id}`,
        type: "mod",
        label: `MOD ${String(p.modCount).padStart(2, "0")} — ${p.name}`,
        detail: p.notes[0]?.body
          ? p.notes[0].body.slice(0, 80) + (p.notes[0].body.length > 80 ? "…" : "")
          : "Formula adjusted",
        projectName: p.name,
        date: p.updatedAt,
        href: `/projects/${p.id}`,
      });
    }
    // Latest evaluation
    if (p.evaluations[0]) {
      const ev = p.evaluations[0];
      items.push({
        id: `eval-${ev.id}`,
        type: "evaluation",
        label: `Evaluation — ${p.name}`,
        detail: ev.whatWorks.slice(0, 80) + (ev.whatWorks.length > 80 ? "…" : ""),
        projectName: p.name,
        date: ev.date,
        href: `/projects/${p.id}?tab=evaluation`,
      });
    }
    // Inspiration (if any images)
    const imgs = p.inspiration.filter((i) => i.type === "image");
    if (imgs.length > 0) {
      items.push({
        id: `insp-${p.id}`,
        type: "inspiration",
        label: `Inspiration — ${p.name}`,
        detail: `${imgs.length} image${imgs.length !== 1 ? "s" : ""} · ${p.inspiration.length} total references`,
        projectName: p.name,
        date: p.createdAt,
        href: `/projects/${p.id}/inspiration`,
      });
    }
    // Material note (first linked material)
    if (p.linkedMaterialNames[0]) {
      const note = p.notes.find((n) => n.tag === "material direction" || n.tag === "direction");
      if (note) {
        items.push({
          id: `matnote-${p.id}`,
          type: "material-note",
          label: p.linkedMaterialNames[0],
          detail: note.body.slice(0, 90) + (note.body.length > 90 ? "…" : ""),
          projectName: p.name,
          date: note.createdAt,
          href: `/materials`,
        });
      }
    }
  }

  // Sort by date desc, take first 6
  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);
}

const WORK_TYPE_LABEL: Record<WorkItem["type"], string> = {
  mod: "Mod",
  evaluation: "Evaluation",
  inspiration: "Inspiration",
  "material-note": "Material note",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkRow({ item, index }: { item: WorkItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={item.href}
        data-testid={`link-recent-work-${item.id}`}
        className={[
          "group flex min-w-0 items-start justify-between gap-4",
          "border-t border-border py-4",
          // full-bleed hover — negative horizontal margin offset to match shell padding
          "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
          "transition-colors duration-150",
          "hover:bg-secondary/25 focus-visible:outline-none focus-visible:bg-secondary/30",
          "active:bg-secondary/40",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          {/* Label uses main font, not mono */}
          <p className="truncate text-sm leading-snug text-foreground">{item.label}</p>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
            {item.detail}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 pt-0.5">
          <span className="hidden font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground/60 sm:block">
            {WORK_TYPE_LABEL[item.type]}
          </span>
          <span className="font-mono-ui text-[8px] text-muted-foreground/60">
            {relativeDate(item.date)}
          </span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/30 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground/60"
          />
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectRow({
  project,
  index,
}: {
  project: (typeof DEMO_PROJECTS)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/projects/${project.id}`}
        data-testid={`link-studio-project-${project.id}`}
        className={[
          "group flex min-w-0 items-start justify-between gap-4",
          "border-t border-border py-5",
          "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
          "transition-colors duration-150",
          "hover:bg-secondary/25 focus-visible:outline-none focus-visible:bg-secondary/30",
          "active:bg-secondary/40",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          {/* Project name — display font, not mono */}
          <p className="text-base font-medium leading-snug text-foreground">{project.name}</p>
          {/* Olfactive direction — small, subdued */}
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {project.olfactiveDirection}
          </p>
          {/* Metadata — mono for status / date */}
          <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground/50">
            MOD {String(project.modCount).padStart(2, "0")} · {relativeDate(project.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-1">
          <span
            className={[
              "font-mono-ui text-[8px] uppercase tracking-[.12em]",
              project.status === "active"
                ? "text-foreground/60"
                : "text-muted-foreground/40",
            ].join(" ")}
          >
            {project.status}
          </span>
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            className="text-muted-foreground/30 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted-foreground/60"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Studio() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  }, []);

  // Representative: most recently updated active project leads the hero
  const activeProjects = DEMO_PROJECTS.filter((p) => p.status === "active").sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const heroProject = activeProjects[0] ?? DEMO_PROJECTS[0];
  const otherActiveProjects = activeProjects.slice(1);

  // Recent formulas from real API — used only in Recent Work if no activity
  const recentFormulas = (formulasQuery.data ?? summaryQuery.data?.recentFormulas ?? []).slice(0, 3);

  // Representative recent work list
  const recentWork = useMemo(() => buildRecentWork(), []);

  // Quick Create items — only genuinely functional ones link; the rest are labeled
  const quickCreate = [
    { label: "New formula", href: "/formulas/new", testId: "link-qc-formula", functional: true },
    { label: "Import file", href: "/files", testId: "link-qc-import", functional: true },
    { label: "Browse materials", href: "/materials", testId: "link-qc-materials", functional: true },
    { label: "New project", href: null, testId: "link-qc-project", functional: false, note: "Preview — not yet available" },
  ];

  // Loading state — only block for hero summary
  const isLoading = summaryQuery.isLoading;

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        {/* Hero skeleton */}
        <div className="-mx-5 sm:-mx-8 lg:-mx-12 bg-foreground px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="mt-5 h-12 w-2/3 bg-white/10" />
          <Skeleton className="mt-10 h-8 w-1/3 bg-white/10" />
        </div>
        <div className="mt-10 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">

      {/* ── A. CONTINUE WORKING — black hero ──────────────────────────── */}
      <motion.section
        data-testid="studio-hero"
        className={[
          // Full-bleed: negative margin to cancel shell padding, positive padding to restore
          "-mx-5 sm:-mx-8 lg:-mx-12",
          "bg-foreground",
          "px-5 py-12 sm:px-8 sm:py-14 lg:px-12",
          // Prevent any child from overflowing
          "overflow-hidden",
        ].join(" ")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        {/* Greeting */}
        <motion.p
          className="font-mono-ui text-[9px] uppercase tracking-[.32em] text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {greeting}
        </motion.p>

        {/* Continue working label */}
        <motion.p
          className="mt-6 font-mono-ui text-[8px] uppercase tracking-[.28em] text-white/30"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.1 }}
        >
          Continue working
        </motion.p>

        {/* Hero project */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={`/projects/${heroProject.id}`}
            data-testid="link-studio-continue"
            className="group mt-3 block"
          >
            {/* Project name — display font */}
            <h1
              data-testid="heading-studio"
              className={[
                "font-display leading-[.88] tracking-[-0.03em] text-white",
                "transition-opacity duration-200 group-hover:opacity-70",
                // Clamp prevents overflow on narrow viewports
                "break-words",
              ].join(" ")}
              style={{ fontSize: "clamp(2rem, 7vw, 5rem)" }}
            >
              {heroProject.name}
            </h1>

            {/* Project description — main font, subdued */}
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              {heroProject.description}
            </p>

            {/* Metadata — mono for status/date */}
            <p className="mt-4 font-mono-ui text-[9px] uppercase tracking-[.2em] text-white/30">
              MOD {String(heroProject.modCount).padStart(2, "0")} · {heroProject.status} ·{" "}
              {relativeDate(heroProject.updatedAt)}
            </p>

            {/* Continue CTA */}
            <span
              className={[
                "mt-6 inline-flex items-center gap-3",
                "font-mono-ui text-[10px] uppercase tracking-[.22em] text-white/50",
                "transition-all duration-200 group-hover:text-white group-hover:gap-4",
              ].join(" ")}
            >
              Continue
              <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      </motion.section>

      {/* ── B. ACTIVE PROJECTS ────────────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        data-testid="section-active-projects"
      >
        <div className="flex items-center justify-between pb-1">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
            Active projects
          </p>
          <Link
            href="/projects"
            data-testid="link-studio-view-projects"
            className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            View all →
          </Link>
        </div>

        {/* Hero project shown first (without repeat of the full description) */}
        <ProjectRow project={heroProject} index={0} />

        {/* Other active projects */}
        {otherActiveProjects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i + 1} />
        ))}

        {activeProjects.length === 0 && (
          <div className="border-t border-border py-8">
            <p className="text-sm text-muted-foreground">No active projects.</p>
          </div>
        )}
      </motion.section>

      {/* ── C. RECENT WORK ───────────────────────────────────────────── */}
      <motion.section
        className="pt-10 pb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.28 }}
        data-testid="section-recent-work"
      >
        <div className="flex items-center justify-between pb-1">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
            Recent work
          </p>
        </div>

        {/* Representative items from local project data */}
        {recentWork.map((item, i) => (
          <WorkRow key={item.id} item={item} index={i} />
        ))}

        {/* Append real formula rows if API has data and list is short */}
        {recentWork.length < 3 &&
          recentFormulas.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.1 + i * 0.04 }}
            >
              <Link
                href={`/formulas/${f.id}`}
                data-testid={`link-recent-formula-${f.id}`}
                className={[
                  "group flex min-w-0 items-start justify-between gap-4",
                  "border-t border-border py-4",
                  "-mx-5 px-5 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12",
                  "transition-colors duration-150",
                  "hover:bg-secondary/25 focus-visible:outline-none focus-visible:bg-secondary/30",
                  "active:bg-secondary/40",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{f.name || "Untitled"}</p>
                  {f.brief && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{f.brief}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4 pt-0.5">
                  <span className="font-mono-ui text-[8px] text-muted-foreground/60">
                    {relativeDate(f.updatedAt)}
                  </span>
                  <ArrowRight
                    size={11}
                    strokeWidth={1.5}
                    className="text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/60"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.section>

      {/* ── D. QUICK CREATE ───────────────────────────────────────────── */}
      <motion.section
        className="border-t border-border pt-8 pb-12 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.36 }}
        data-testid="section-quick-create"
      >
        <p className="mb-4 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
          Quick create
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {quickCreate.map(({ label, href, testId, functional, note }) =>
            functional && href ? (
              <Link
                key={testId}
                href={href}
                data-testid={testId}
                className={[
                  "group inline-flex items-center gap-2",
                  "text-sm text-foreground/70",
                  "transition-colors duration-150 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:text-foreground",
                ].join(" ")}
              >
                {label}
                <ArrowRight
                  size={10}
                  strokeWidth={1.5}
                  className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/60"
                />
              </Link>
            ) : (
              <span
                key={testId}
                data-testid={testId}
                title={note}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground/40 cursor-default select-none"
                aria-disabled="true"
              >
                {label}
                <span className="font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/30">
                  Preview
                </span>
              </span>
            )
          )}
        </div>
      </motion.section>

      {/* ── Representative workspace note — shown once, quietly ──────── */}
      <div className="border-t border-border/50 pb-8">
        <p className="pt-4 font-mono-ui text-[7px] uppercase tracking-[.14em] text-muted-foreground/35 leading-5">
          Project data is representative — local demo workspace. Formula and material data is live from your account.
        </p>
      </div>

    </div>
  );
}
