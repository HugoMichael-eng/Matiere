import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Beaker, Bookmark, BookOpen, ChevronDown, ChevronRight, CircleAlert,
  Download, File, FileImage, FileText, FlaskConical, Gauge, Leaf, LogOut, Menu, Minus, Paperclip, Plus,
  Pencil, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, Upload, X,
  Lightbulb, TestTube2, BarChart2, Zap, FileCheck, PackageSearch
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Redirect, Route, Switch, useLocation, useParams, useSearch, Router as WouterRouter } from "wouter";
import auraFanetteImage from "@assets/DTS_AURA_Fanette_Guilloud_Photos_ID12991.jpg";
import {
  getGetConversationQueryKey, getGetDashboardSummaryQueryKey, getGetFormulaEventsQueryKey, getGetFormulaQueryKey,
  getListConversationsQueryKey, getListFormulasQueryKey,
  useCreateConversation, useCreateFormula, useDeleteConversation, useDeleteFormula,
  useGetActivity, useGetConversation, useGetDashboardSummary, useGetFormula,
  useGetFormulaEvents, useListConversations, useListFormulas, useListMaterials,
  useSendConversationMessage, useUpdateFormula,
} from "@workspace/api-client-react";
import type { Formula, FormulaEvent, FormulaIngredientInput, Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";
import { MarkdownMessage } from "./components/MarkdownMessage";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function Logo({ _light = false }: { _light?: boolean }) {
  // Always links back to landing — workspace entry is intentional via a labeled action
  void _light;
  return (
    <Link href="/" data-testid="link-brand" className="group">
      <span className="font-mono-ui text-[10px] font-medium tracking-[.32em] uppercase text-foreground/85 transition-opacity group-hover:opacity-60">
        MATIÈRE
      </span>
    </Link>
  );
}

function Button({ children, onClick, href, variant = "primary", testId, disabled, type = "button" }: {
  children: ReactNode; onClick?: () => void; href?: string; variant?: "primary" | "quiet" | "outline" | "danger";
  testId: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "primary" ? "bg-primary text-primary-foreground hover:opacity-80" :
    variant === "outline" ? "border border-foreground/20 bg-transparent text-foreground hover:border-foreground" :
    variant === "danger" ? "bg-destructive text-destructive-foreground hover:opacity-80" :
    "bg-transparent text-muted-foreground hover:text-foreground"
  }`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} data-testid={testId}>{children}</button>;
}

const IFRA_CATEGORIES: { value: string; label: string }[] = [
  { value: "1",   label: "Cat 1 — Lip products" },
  { value: "2",   label: "Cat 2 — Deodorant & antiperspirant" },
  { value: "3",   label: "Cat 3 — Eye area products" },
  { value: "4",   label: "Cat 4 — Fine fragrance (EdT, EdP, cologne)" },
  { value: "5a",  label: "Cat 5a — Body lotion / body cream" },
  { value: "5b",  label: "Cat 5b — Face moisturiser (leave-on)" },
  { value: "5c",  label: "Cat 5c — Hand cream" },
  { value: "5d",  label: "Cat 5d — Baby products (leave-on)" },
  { value: "6",   label: "Cat 6 — Oral care (mouthwash)" },
  { value: "7a",  label: "Cat 7a — Leave-on hair products" },
  { value: "7b",  label: "Cat 7b — Aerosol hair products (leave-on)" },
  { value: "8",   label: "Cat 8 — Makeup (non-eye, non-lip)" },
  { value: "9a",  label: "Cat 9a — Rinse-off hair (shampoo)" },
  { value: "9b",  label: "Cat 9b — Rinse-off hair colouring" },
  { value: "10a", label: "Cat 10a — Home care / spray cleaners" },
  { value: "10b", label: "Cat 10b — Fabric softener" },
  { value: "11a", label: "Cat 11a — Candles" },
  { value: "11b", label: "Cat 11b — Room / reed diffusers" },
  { value: "12",  label: "Cat 12 — Other (industrial / professional)" },
];

function IfraCategoryPicker({ value, onChange, testId }: { value: string; onChange: (v: string) => void; testId?: string }) {
  const [open, setOpen] = useState(false);
  const selected = IFRA_CATEGORIES.find(c => c.value === value);
  return (
    <div className="mt-7">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="text-xs font-medium">IFRA product category</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {selected ? selected.label : <span className="italic">Not set</span>}
          <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <select
              autoFocus
              value={value}
              onChange={e => { onChange(e.target.value); setOpen(false); }}
              data-testid={testId}
              className="mt-3 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40"
            >
              <option value="">— Not set</option>
              {IFRA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const navItems = [
  { href: "/studio",    label: "Studio"    },
  { href: "/projects",  label: "Projects"  },
  { href: "/formulas",  label: "Formulas"  },
  { href: "/materials", label: "Materials" },
];

function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <aside className="hidden min-h-[100dvh] w-[180px] shrink-0 flex-col bg-sidebar px-6 py-8 text-sidebar-foreground md:flex border-r border-border">
      <Logo />
      <nav className="mt-16 space-y-0">
        {navItems.map(({ href, label }) => {
          const active = location === href || (href !== "/studio" && location.startsWith(href));
          return (
            <Link
              href={href}
              key={href}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
              className={[
                "flex items-center gap-3 py-2.5 font-mono-ui text-[9px] tracking-[.22em] uppercase transition-colors duration-150",
                "focus-visible:outline-none",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {active
                ? <span className="h-[1px] w-3 bg-accent shrink-0" aria-hidden />
                : <span className="h-[1px] w-3 shrink-0" aria-hidden />
              }
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="border-t border-border pt-5">
          <p className="truncate font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">
            {user?.firstName ?? "Studio"}
          </p>
          <button
            onClick={() => signOut({ redirectUrl: (basePath || "") + "/" })}
            data-testid="button-sign-out"
            className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            aria-label="Sign out"
          >
            <LogOut size={10} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  return (
    <div className="relative flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
      <Logo />
      <button
        onClick={() => setOpen(!open)}
        data-testid="button-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
      >
        {open ? <X size={14} strokeWidth={1.5} /> : <Menu size={14} strokeWidth={1.5} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full z-40 border-b border-border bg-background"
          >
            {navItems.map(({ href, label }) => {
              const active = location === href || (href !== "/studio" && location.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`}
                  className={[
                    "flex items-center gap-3 border-t border-border px-5 py-4",
                    "font-mono-ui text-[9px] uppercase tracking-[.22em]",
                    "transition-colors duration-150",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {active && <span className="h-[1px] w-3 bg-accent shrink-0" aria-hidden />}
                  {label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] bg-background animate-fade-in overflow-x-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <MobileNav />
        <main className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-20 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-0 flex flex-col justify-between gap-4 border-b border-border pt-10 pb-7 sm:flex-row sm:items-end">
      <div>
        <p className="font-mono-ui text-[8px] uppercase tracking-[.32em] text-muted-foreground">{eyebrow}</p>
        <h1
          className="mt-2 font-display tracking-[-0.04em] leading-[.86] text-foreground"
          style={{ fontSize: "clamp(2.4rem, 5vw, 4.5rem)" }}
          data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  const style = value === "approved" || value === "clear" || value === "within_limit" ? "text-muted-foreground border-l-2 pl-2 border-border" : value === "blocked" || value === "exceeds_limit" ? "text-destructive" : "text-accent-foreground border-l-2 pl-2 border-accent";
  return <span className={`inline-flex items-center font-mono-ui text-[9px] uppercase tracking-[.08em] ${style}`} data-testid={`status-${value}`}>{label}</span>;
}

function Skeleton({ className = "" }: { className?: string }) { return <div className={`animate-pulse bg-muted ${className}`} />; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="border border-destructive/30 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-3 font-display text-2xl">The studio is quiet.</p><p className="mt-1 text-sm text-muted-foreground">We couldn't read your workspace just now.</p><div className="mt-4"><Button onClick={retry} variant="outline" testId="button-retry">Try again</Button></div></div>; }

/** Lab-notebook section separator: hairline rule with a centred monospace label */
function SectionRule({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative flex items-center gap-4 py-6"
    >
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 bg-background px-3 font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKFLOW MODEL — nine-stage lab process
// ─────────────────────────────────────────────────────────────────────────────
type WorkflowStageId = "conceive" | "create" | "formulate" | "analyze" | "check" | "optimize" | "document" | "source" | "make";

interface WorkflowStage {
  id: WorkflowStageId;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
  nextAction: string;
  nextHref?: string; // relative or parametric
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "conceive",
    label: "Conceive",
    short: "01",
    icon: Lightbulb,
    description: "Define the feeling, brief, and olfactive direction. Explore AI-generated starting points.",
    nextAction: "Generate ideas or name this formula",
    nextHref: "/formulas/new",
  },
  {
    id: "create",
    label: "Create",
    short: "02",
    icon: Sparkles,
    description: "Crystallise the concept and seed the ingredient list from your brief or a blueprint.",
    nextAction: "Open a new formula",
    nextHref: "/formulas/new",
  },
  {
    id: "formulate",
    label: "Formulate",
    short: "03",
    icon: FlaskConical,
    description: "Add and balance every material in the blend. Set concentrations, dilutions, and roles.",
    nextAction: "Edit the formula builder",
  },
  {
    id: "analyze",
    label: "Analyze",
    short: "04",
    icon: BarChart2,
    description: "Review the olfactive profile by role and family. Identify top, heart, and base balance.",
    nextAction: "Review the olfactive structure",
  },
  {
    id: "check",
    label: "Check",
    short: "05",
    icon: ShieldCheck,
    description: "Run IFRA compliance and allergen review against the specified product category.",
    nextAction: "Review IFRA and allergen status",
  },
  {
    id: "optimize",
    label: "Optimize",
    short: "06",
    icon: Zap,
    description: "Identify adjustments, swap materials, and refine percentages for your next trial.",
    nextAction: "Plan the next iteration",
  },
  {
    id: "document",
    label: "Document",
    short: "07",
    icon: FileCheck,
    description: "Write the formula record, update notes, and review the full change history.",
    nextAction: "Review history and notes",
  },
  {
    id: "source",
    label: "Source",
    short: "08",
    icon: PackageSearch,
    description: "Identify gaps in your stock and link to trusted suppliers for missing materials.",
    nextAction: "Check material gaps",
    nextHref: "/shop",
  },
  {
    id: "make",
    label: "Make",
    short: "09",
    icon: TestTube2,
    description: "Calculate bench-ready batch weights for each material at your chosen volume.",
    nextAction: "Generate batch sheet",
  },
];

function getCompletedWorkflowStages(formula?: Formula, materials: Material[] = []): Set<WorkflowStageId> {
  const done = new Set<WorkflowStageId>();
  if (!formula) return done;

  const hasIngredients = formula.ingredients.length > 0;
  const allLinked = hasIngredients && formula.ingredients.every(ingredient => ingredient.materialId > 0);
  const totalPercentage = formula.ingredients.reduce((sum, ingredient) => sum + ingredient.percentage, 0);
  const materialById = new Map(materials.map(material => [material.id, material]));
  const stockIsKnownAndAvailable = allLinked
    && materials.length > 0
    && formula.ingredients.every(ingredient => materialById.get(ingredient.materialId)?.inStock === true);

  if (formula.brief.trim()) done.add("conceive");
  done.add("create");
  if (hasIngredients) done.add("formulate");
  if (allLinked) done.add("analyze");
  if (allLinked && !!formula.ifraCategory) done.add("check");
  if (hasIngredients && Math.abs(totalPercentage - formula.concentration) <= 0.1) done.add("optimize");
  if (formula.version >= 1) done.add("document");
  if (stockIsKnownAndAvailable) done.add("source");
  if (hasIngredients && formula.totalMl > 0 && formula.concentration > 0) done.add("make");
  return done;
}

function getSuggestedWorkflowStage(formula?: Formula, materials: Material[] = []): WorkflowStageId {
  if (!formula) return "conceive";
  const completed = getCompletedWorkflowStages(formula, materials);
  return WORKFLOW_STAGES.find(stage => !completed.has(stage.id))?.id ?? "make";
}

/** Horizontal scrolling workflow progress bar — used on dashboard, new formula, and formula detail */
function WorkflowNav({
  activeStage,
  formulaId,
  onSelect,
  completedStages,
  compact = false,
}: {
  activeStage?: WorkflowStageId;
  formulaId?: number;
  onSelect?: (stage: WorkflowStageId) => void;
  completedStages?: Set<WorkflowStageId>;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-x-auto border-b border-border"
      data-testid="workflow-nav"
    >
      <div className="flex min-w-max">
        {WORKFLOW_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          const isDone = completedStages?.has(stage.id);
          const isClickable = !!onSelect || !!formulaId;
          const href = formulaId ? `/formulas/${formulaId}?stage=${stage.id}` : undefined;
          const content = (
            <motion.div
              key={stage.id}
              data-testid={`workflow-stage-${stage.id}`}
              whileHover={isClickable ? { backgroundColor: "hsl(var(--secondary))" } : {}}
              className={[
                "relative flex flex-col items-start px-4 py-4 transition-colors",
                compact ? "min-w-[96px]" : "min-w-[110px]",
                i < WORKFLOW_STAGES.length - 1 ? "border-r border-border" : "",
                isActive ? "bg-secondary/50" : "",
                isClickable ? "cursor-pointer" : "",
              ].join(" ")}
              onClick={onSelect ? () => onSelect(stage.id) : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="workflow-active-bar"
                  className="absolute inset-x-0 top-0 h-[2px] bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <div className={`flex items-center gap-1.5 ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                <Icon size={compact ? 11 : 12} strokeWidth={1.8} />
                <span className={`font-mono-ui uppercase tracking-[.14em] ${compact ? "text-[8px]" : "text-[8px]"}`}>{stage.short}</span>
              </div>
              <p className={`mt-1.5 font-mono-ui text-[10px] font-medium uppercase tracking-[.08em] transition-colors ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                {stage.label}
              </p>
              {isDone && !isActive && (
                <div className="absolute bottom-2 right-2 h-[3px] w-[3px] bg-accent" />
              )}
            </motion.div>
          );

          if (href && !onSelect) {
            return (
              <Link key={stage.id} href={href} data-testid={`link-workflow-${stage.id}`}>
                {content}
              </Link>
            );
          }
          return <div key={stage.id}>{content}</div>;
        })}
      </div>
    </motion.div>
  );
}

/** Stage-specific content panel — shown inside FormulaDetail when a stage is selected */
function WorkflowStagePanel({
  stage,
  formula,
  materials,
  events,
  onEdit,
}: {
  stage: WorkflowStageId;
  formula: Formula;
  materials: Material[];
  events: Array<{ id: number; formulaId: number; formulaName: string; type: string; summary: string; createdAt: string }>;
  onEdit: () => void;
}) {
  const [, setLocation] = useLocation();
  const [batchMl, setBatchMl] = useState(formula.totalMl);

  useEffect(() => {
    setBatchMl(formula.totalMl);
  }, [formula.id, formula.totalMl]);

  if (stage === "formulate") {
    // Show the ingredient map — prompt to edit
    const unlinked = formula.ingredients.filter(i => i.materialId === 0).length;
    const totalPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    return (
      <motion.div key="formulate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formulate · palette</p>
              <h2 className="mt-1 font-display text-3xl">Materials in the blend</h2>
            </div>
            <button onClick={onEdit} data-testid="button-wf-edit" className="border border-border px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:bg-secondary">Edit blend</button>
          </div>
          {unlinked > 0 && (
            <div className="mt-4 flex items-start gap-2.5 border border-accent/30 bg-accent/10 px-4 py-3">
              <CircleAlert size={13} className="mt-0.5 shrink-0 text-accent-foreground/70" />
              <p className="font-mono-ui text-[10px] uppercase tracking-[.1em] leading-5 text-accent-foreground/70">{unlinked} ingredient{unlinked !== 1 ? "s" : ""} not yet linked to your library</p>
            </div>
          )}
          <div className="mt-5 space-y-1">
            {formula.ingredients.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_70px_80px] items-center gap-2 border-t border-border py-3 first:border-t-0">
                <div>
                  <p className="text-sm font-medium">{item.materialName}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">{item.role}</p>
                </div>
                <p className="text-right font-mono-ui text-xs">{item.percentage}%</p>
                <p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p>
                <p className="text-right font-mono-ui text-[9px] text-muted-foreground">dil {item.dilution ?? 100}%</p>
              </div>
            ))}
            {!formula.ingredients.length && <p className="py-6 text-center text-sm text-muted-foreground">No materials added yet.</p>}
          </div>
          {formula.ingredients.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="h-[2px] w-24 overflow-hidden bg-border">
                <div className="h-full bg-foreground" style={{ width: `${formula.concentration > 0 ? Math.min((totalPct / formula.concentration) * 100, 100) : 0}%` }} />
              </div>
              <span className={`font-mono-ui text-[10px] ${totalPct > formula.concentration ? "text-destructive" : Math.abs(totalPct - formula.concentration) <= 0.1 ? "text-accent-foreground" : "text-muted-foreground"}`}>{Math.round(totalPct * 10) / 10}% of {formula.concentration}% target</span>
            </div>
          )}
        </div>
        <div className="border border-border bg-card p-5 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Ready to read the olfactive structure?</p>
          <button onClick={() => setLocation(`/formulas/${formula.id}?stage=analyze`)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Continue to Analyze</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "analyze") {
    // Olfactive structure by role and family
    const byRole: Record<string, typeof formula.ingredients> = { top: [], heart: [], base: [], modifier: [] };
    formula.ingredients.forEach(i => { (byRole[i.role] ??= []).push(i); });
    const roleLabels: Record<string, string> = { top: "Top notes", heart: "Heart notes", base: "Base notes", modifier: "Modifiers" };
    const totalGrams = formula.ingredients.reduce((s, i) => s + i.grams, 0);

    // Families from materials library cross-reference
    const matById = new Map(materials.map(m => [m.id, m]));
    const familyCounts: Record<string, number> = {};
    formula.ingredients.forEach(ing => {
      const mat = matById.get(ing.materialId);
      if (mat?.family) {
        familyCounts[mat.family] = (familyCounts[mat.family] ?? 0) + ing.percentage;
      }
    });
    const families = Object.entries(familyCounts).sort((a, b) => b[1] - a[1]);

    return (
      <motion.div key="analyze" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Analyze · olfactive profile</p>
          <h2 className="mt-1 font-display text-3xl">Structure</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Reading source</p>
              <p className="mt-2 text-sm">Stored formula v{formula.version} · {formula.ingredients.length} materials</p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Interpretation</p>
              <p className="mt-2 text-sm">Role proportions and linked material families, calculated from this formula.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {(["top", "heart", "base", "modifier"] as const).map(role => {
              const items = byRole[role] ?? [];
              if (!items.length) return null;
              const rolePct = items.reduce((s, i) => s + i.percentage, 0);
              const barW = totalGrams > 0 ? `${Math.round((items.reduce((s, i) => s + i.grams, 0) / totalGrams) * 100)}%` : "0%";
              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{roleLabels[role]}</p>
                    <span className="font-mono-ui text-[10px] text-muted-foreground">{Math.round(rolePct * 10) / 10}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-border mb-3">
                    <motion.div className="h-full bg-foreground" initial={{ width: 0 }} animate={{ width: barW }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  <div className="space-y-2">
                    {items.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <p className="text-sm">{ing.materialName}</p>
                        <span className="font-mono-ui text-[10px] text-muted-foreground">{ing.grams}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {families.length > 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground mb-4">Material families</p>
            <div className="space-y-3">
              {families.map(([family, pct]) => (
                <div key={family}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs">{family}</p>
                    <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round(pct * 10) / 10}%</span>
                  </div>
                  <div className="h-[2px] w-full bg-border">
                    <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                  </div>
                </div>
              ))}
            </div>
            {families.length === 0 && <p className="text-sm text-muted-foreground">Link ingredients to your library to see family breakdown.</p>}
          </div>
        )}
        <div className="border border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Olfactive structure derived from current ingredients and linked material families.</p>
        </div>
      </motion.div>
    );
  }

  if (stage === "check") {
    const flaggedIngredients = formula.ingredients.filter(i => (i.allergenFlags ?? []).length > 0);
    const ifraCat = IFRA_CATEGORIES.find(c => c.value === formula.ifraCategory);
    const statusIsOk = formula.safetyStatus === "clear" && formula.ifraStatus === "within_limit";

    return (
      <motion.div key="check" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Check · safety screening</p>
          <h2 className="mt-1 font-display text-3xl">IFRA &amp; allergens</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Safety status</p>
              <p className="mt-2"><StatusPill value={formula.safetyStatus} /></p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">IFRA status</p>
              <p className="mt-2"><StatusPill value={formula.ifraStatus} /></p>
            </div>
            <div className="border border-border bg-secondary/20 px-4 py-4">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Allergen notes</p>
              <p className="mt-2 font-mono-ui text-[11px]">{formula.allergenCount}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-2">Product category</p>
            {ifraCat
              ? <p className="text-sm">{ifraCat.label}</p>
              : <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground italic">Not set.</p>
                  <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Set category in Edit</button>
                </div>
            }
          </div>

          {flaggedIngredients.length > 0 ? (
            <div className="mt-6 space-y-3">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Flagged ingredients</p>
              {flaggedIngredients.map((item, i) => (
                <div key={i} className="border-l-2 border-destructive/60 bg-destructive/5 pl-4 py-2">
                  <p className="text-sm font-medium">{item.materialName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{(item.allergenFlags ?? []).join(", ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No allergen flags on any ingredient.</p>
          )}

          {!statusIsOk && (
            <div className="mt-5 border border-accent/30 bg-accent/10 px-4 py-4">
              <p className="text-sm text-accent-foreground/80">This formula has items that need review. Edit the formula to adjust concentrations.</p>
            </div>
          )}
          <p className="mt-5 font-mono-ui text-[8px] uppercase tracking-[.12em] leading-5 text-muted-foreground/60">
            Screening guidance only. Confirm the latest supplier documentation and current IFRA standards before production.
          </p>
        </div>
        <div className="border border-border bg-card px-5 py-3">
          <p className="text-xs text-muted-foreground">Screening guidance only — confirm current IFRA standards and supplier documentation before production.</p>
        </div>
      </motion.div>
    );
  }

  if (stage === "optimize") {
    const totalPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    const overFormulaIngredients = formula.ingredients.filter(i => i.percentage > 30);
    const minorIngredients = formula.ingredients.filter(i => i.percentage < 1 && i.percentage > 0);
    const unlinked = formula.ingredients.filter(i => i.materialId === 0);
    const materialById = new Map(materials.map(material => [material.id, material]));

    return (
      <motion.div key="optimize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Optimize · next iteration</p>
          <h2 className="mt-1 font-display text-3xl">Observations</h2>

          <div className="mt-6 space-y-4">
            {Math.abs(totalPct - formula.concentration) > 0.1 && (
              <div className="flex items-start gap-3 border-l-2 border-border pl-4 py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Aromatic total is {Math.round(totalPct * 10) / 10}% of the finished batch</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{totalPct < formula.concentration ? `${Math.round((formula.concentration - totalPct) * 10) / 10}% remains below the ${formula.concentration}% concentration target.` : `Exceeds the ${formula.concentration}% concentration target — reduce one or more materials.`}</p>
                </div>
              </div>
            )}
            {overFormulaIngredients.map(ing => (
              <div key={ing.materialName} className="flex items-start gap-3 border-l-2 border-accent/40 pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{ing.materialName} at {ing.percentage}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">High proportion — consider splitting with a complementary material or reducing to improve balance.</p>
                </div>
              </div>
            ))}
            {minorIngredients.map(ing => (
              <div key={ing.materialName} className="flex items-start gap-3 border-l-2 border-muted pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{ing.materialName} at {ing.percentage}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Very minor amount — check if this is intentional or a trace left from an earlier version.</p>
                </div>
              </div>
            ))}
            {unlinked.length > 0 && (
              <div className="flex items-start gap-3 border-l-2 border-destructive/50 pl-4 py-1">
                <div>
                  <p className="text-sm font-medium">{unlinked.length} unlinked ingredient{unlinked.length !== 1 ? "s" : ""}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Link these to your library to unlock allergen data, IFRA limits, and material family analysis.</p>
                </div>
              </div>
            )}
            {Math.abs(totalPct - formula.concentration) <= 0.1 && !overFormulaIngredients.length && !unlinked.length && (
              <p className="text-sm text-muted-foreground">No structural flags — the formula looks balanced at current proportions.</p>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Material comparison</p>
            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[1fr_100px_150px_110px] gap-3 border-b border-border pb-2 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground">
                  <span>Material</span><span>Availability</span><span>Known restrictions</span><span>Cost</span>
                </div>
                {formula.ingredients.map((ingredient, index) => {
                  const material = materialById.get(ingredient.materialId);
                  const restrictions = material
                    ? [
                        material.allergens.length ? `${material.allergens.length} allergen note${material.allergens.length === 1 ? "" : "s"}` : null,
                        material.ifraLimit > 0 ? `IFRA limit ${material.ifraLimit}%` : null,
                        material.safetyStatus !== "low" ? material.safetyStatus : null,
                      ].filter(Boolean).join(" · ") || "None recorded"
                    : "Unknown — not linked";
                  return (
                    <div key={`${ingredient.materialId}-${index}`} className="grid grid-cols-[1fr_100px_150px_110px] gap-3 border-b border-border py-3 text-xs">
                      <span className="font-medium">{ingredient.materialName}</span>
                      <span className="text-muted-foreground">{material ? (material.inStock ? "In stock" : "Out of stock") : "Unknown"}</span>
                      <span className="text-muted-foreground">{restrictions}</span>
                      <span className="text-muted-foreground">Not recorded</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {!formula.ingredients.length && <p className="mt-3 text-sm text-muted-foreground">Add materials to compare availability and known restrictions.</p>}
            <p className="mt-4 font-mono-ui text-[8px] uppercase tracking-[.14em] leading-5 text-muted-foreground/60">Cost data is unavailable because supplier pricing and cost-per-gram are not currently tracked. No estimate has been substituted.</p>
          </div>
        </div>
        <div className="border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-optimize-edit">Edit formula</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "document") {
    return (
      <motion.div key="document" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Document · notes and history</p>
          <h2 className="mt-1 font-display text-3xl">Notebook</h2>
          <div className="mt-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Notes</p>
            {formula.notes
              ? <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{formula.notes}</p>
              : <div className="flex items-center gap-3 py-2">
                  <p className="text-sm text-muted-foreground italic">No notes yet.</p>
                  <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Add notes in Edit</button>
                </div>
            }
          </div>
        </div>
        {events.length > 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground mb-4">Change history</p>
            <div className="space-y-0">
              {events.map((ev, i) => (
                <div key={ev.id} className={`flex items-start gap-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="shrink-0 w-16 font-mono-ui text-[8px] text-muted-foreground pt-0.5">
                    {new Date(ev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-5">{ev.summary}</p>
                    <p className="mt-0.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">{ev.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {events.length === 0 && (
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Change history</p>
            <p className="mt-3 text-sm text-muted-foreground">No changes recorded yet.</p>
          </div>
        )}
        <div className="border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Update stage in Edit</button>
        </div>
      </motion.div>
    );
  }

  if (stage === "source") {
    const matById = new Map(materials.map(m => [m.id, m]));
    const missingStock = formula.ingredients
      .map(ing => ({ ing, mat: matById.get(ing.materialId) }))
      .filter(({ mat }) => mat && !mat.inStock);
    const unlinked = formula.ingredients.filter(i => i.materialId === 0);
    const linkedUnknown = formula.ingredients.filter(ingredient => ingredient.materialId > 0 && !matById.has(ingredient.materialId));

    return (
      <motion.div key="source" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Source · material gaps</p>
          <h2 className="mt-1 font-display text-3xl">Stock check</h2>

          {missingStock.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Not in stock ({missingStock.length})</p>
              {missingStock.map(({ ing, mat }) => (
                <div key={ing.materialName} className="flex items-center justify-between border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{ing.materialName}</p>
                    <p className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">{mat?.family} · {mat?.origin}</p>
                  </div>
                  <Link href={`/shop`} className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors" data-testid={`link-source-${ing.materialName}`}>Source ↗</Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">All linked materials are marked in stock.</p>
          )}

          {unlinked.length > 0 && (
            <div className="mt-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Unlinked — stock unknown ({unlinked.length})</p>
              {unlinked.map((ing, i) => (
                <div key={i} className="flex items-center justify-between border border-border px-4 py-3 mb-1">
                  <p className="text-sm">{ing.materialName}</p>
                  <Link href={`/materials?search=${encodeURIComponent(ing.materialName)}`} className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Search library ↗</Link>
                </div>
              ))}
            </div>
          )}
          {linkedUnknown.length > 0 && (
            <div className="mt-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground mb-3">Availability unknown ({linkedUnknown.length})</p>
              {linkedUnknown.map((ingredient, index) => (
                <div key={`${ingredient.materialId}-${index}`} className="border border-border px-4 py-3 mb-1">
                  <p className="text-sm">{ingredient.materialName}</p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground/50">Real-time pricing data is not available. Stock status reflects what you have marked in the Materials library.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-5">
          <Link href="/shop" className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="link-wf-source-shop">Browse suppliers</Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/materials" className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Review material library</Link>
        </div>
      </motion.div>
    );
  }

  if (stage === "make") {
    const totalIngredientPct = formula.ingredients.reduce((s, i) => s + i.percentage, 0);
    const concentrateGrams = batchMl * (formula.concentration / 100);
    const solventGrams = Math.max(batchMl - concentrateGrams, 0);
    const makeRows = formula.ingredients.map(ingredient => {
      const weighedGrams = concentrateGrams * (ingredient.percentage / 100);
      const dilution = ingredient.dilution ?? 100;
      return {
        ...ingredient,
        weighedGrams,
        activeGrams: weighedGrams * (dilution / 100),
      };
    });
    const allocatedConcentrateGrams = makeRows.reduce((sum, row) => sum + row.weighedGrams, 0);
    const unallocatedConcentrateGrams = concentrateGrams - allocatedConcentrateGrams;
    const benchSummary = [
      `${formula.name} · version ${formula.version}`,
      `${batchMl} ml finished batch at ${formula.concentration}% concentration`,
      ...makeRows.map(row => `${row.materialName}: ${row.weighedGrams.toFixed(3)} g at ${row.dilution ?? 100}% dilution (${row.activeGrams.toFixed(3)} g active)`),
      `Allocated concentrate: ${allocatedConcentrateGrams.toFixed(3)} g of ${concentrateGrams.toFixed(3)} g target`,
      `Carrier / solvent target: ${solventGrams.toFixed(3)} g`,
      "Bench proxy assumes 1 ml = 1 g until material densities are recorded.",
    ].join("\n");

    return (
      <motion.div key="make" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
        <div className="border border-border bg-card p-6">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Make · bench batch</p>
          <h2 className="mt-1 font-display text-3xl">Batch calculator</h2>

          <div className="mt-5 flex items-end gap-4">
            <label className="block text-xs font-medium">
              Batch volume (ml)
              <input
                type="number"
                min="1"
                value={batchMl}
                onChange={e => setBatchMl(Number(e.target.value) || formula.totalMl)}
                data-testid="input-wf-batch-ml"
                className="mt-2 w-32 border border-border bg-secondary/45 px-3 py-2 text-sm outline-none focus:border-foreground/40"
              />
            </label>
            <p className="pb-2 font-mono-ui text-[9px] text-muted-foreground">Stored target: {formula.totalMl} ml · {formula.concentration}% concentration</p>
          </div>

          {formula.ingredients.length > 0 ? (
            <div className="mt-5">
              <div className="hidden grid-cols-[1fr_80px_80px_80px] gap-2 border-b border-border pb-2 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground sm:grid">
                <span>Material</span><span className="text-right">Original</span><span className="text-right">Scaled</span><span className="text-right">Role</span>
              </div>
              <div className="space-y-0">
                {makeRows.map((ing, i) => {
                  return (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2 border-t border-border py-3 sm:grid-cols-[1fr_80px_80px_80px]">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{ing.materialName}</p>
                        <p className="mt-0.5 font-mono-ui text-[9px] text-muted-foreground">{ing.activeGrams.toFixed(3)}g active · dilution {ing.dilution ?? 100}%</p>
                      </div>
                      <p className="text-right font-mono-ui text-xs text-muted-foreground">{ing.grams}g</p>
                      <p className="text-right font-mono-ui text-xs font-medium">{ing.weighedGrams.toFixed(3)}g</p>
                      <p className="hidden text-right font-mono-ui text-[9px] text-muted-foreground sm:block">{ing.role}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">Fragrance concentrate / carrier</p>
                <p className="font-mono-ui text-xs font-medium">{concentrateGrams.toFixed(3)}g / {solventGrams.toFixed(3)}g</p>
              </div>
              {Math.abs(totalIngredientPct - formula.concentration) > 0.1 && (
                <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.1em] text-muted-foreground/60">
                  Aromatic materials total {Math.round(totalIngredientPct * 10) / 10}% against the {formula.concentration}% concentration target — {Math.abs(unallocatedConcentrateGrams).toFixed(3)}g is {unallocatedConcentrateGrams >= 0 ? "unallocated" : "over-allocated"}. Weights have not been silently normalized.
                </p>
              )}
              <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.1em] leading-5 text-muted-foreground/60">Bench proxy assumes 1 ml = 1 g until individual material densities are recorded.</p>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Add ingredients to the formula to generate a batch sheet.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-5">
          <button onClick={onEdit} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-make-edit">Edit formula</button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => navigator.clipboard.writeText(benchSummary)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-copy-batch">Copy batch</button>
          <span className="text-muted-foreground/30">·</span>
          <button onClick={() => window.print()} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="button-wf-print-batch">Print</button>
          <span className="text-muted-foreground/30">·</span>
          <Link href={`/formulas/${formula.id}?stage=source`} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Check sourcing gaps</Link>
        </div>
      </motion.div>
    );
  }

  // Default / conceive / create — show formula overview with a "Start working" prompt
  return (
    <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
      <div className="border border-border bg-card p-6">
        <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">{WORKFLOW_STAGES.find(s => s.id === stage)?.label} · overview</p>
        <h2 className="mt-1 font-display text-3xl">{WORKFLOW_STAGES.find(s => s.id === stage)?.description}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Status</p>
            <p className="mt-2"><StatusPill value={formula.status} /></p>
          </div>
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Concentration</p>
            <p className="mt-2 font-mono-ui text-[11px]">{formula.concentration}% · {formula.totalMl} ml</p>
          </div>
          <div className="border border-border bg-secondary/20 px-4 py-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">Materials</p>
            <p className="mt-2 font-mono-ui text-[11px]">{formula.ingredients.length} in blend</p>
          </div>
        </div>
        {formula.brief && <p className="mt-5 text-sm leading-6 text-muted-foreground">{formula.brief}</p>}
      </div>
      <div className="border border-border bg-card p-5">
        <button onClick={() => setLocation(`/formulas/${formula.id}?stage=formulate`)} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline">Open ingredient workspace →</button>
      </div>
    </motion.div>
  );
}

/** Dashboard workflow entry strip — kept for FormulaDetail use; not used on dashboard page */
function DashboardWorkflow({ formula }: { formula?: Formula }) {
  const [, setLocation] = useLocation();
  const entryStage = getSuggestedWorkflowStage(formula);
  const completedStages = getCompletedWorkflowStages(formula);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <div className="flex items-center justify-between px-0 pt-5 pb-3">
        <div>
          <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">The process</p>
          <p className="mt-0.5 font-mono-ui text-[10px] uppercase tracking-[.12em] text-foreground">Studio workflow</p>
        </div>
        <button
          onClick={() => setLocation(formula ? `/formulas/${formula.id}?stage=${entryStage}` : "/formulas/new")}
          data-testid="button-workflow-entry"
          className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {formula ? `Continue ${formula.name}` : "Start a formula"} →
        </button>
      </div>
      <WorkflowNav activeStage={entryStage} formulaId={formula?.id} completedStages={completedStages} compact />
    </motion.div>
  );
}

/** Contact-sheet image tile with a monospace caption */
function ImageTile({ src, caption, objectPosition = "center" }: { src: string; caption: string; objectPosition?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <div className="overflow-hidden" style={{ height: "40vh", minHeight: 220 }}>
        <img
          src={src}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      </div>
      <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground">{caption}</p>
    </motion.div>
  );
}

function FormulaRow({ formula }: { formula: Formula }) {
  return (
    <Link href={`/formulas/${formula.id}`} data-testid={`row-formula-${formula.id}`}>
      <motion.div
        className="group relative grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-5 overflow-hidden sm:grid-cols-[1.5fr_1fr_110px_110px_24px]"
        whileHover="hovered" initial="idle"
      >
        {/* Sweep bar */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-secondary/70 origin-left"
          variants={{ idle: { scaleX: 0 }, hovered: { scaleX: 1 } }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="relative min-w-0"
          variants={{ idle: { x: 0 }, hovered: { x: 6 } }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="truncate text-sm font-medium">{formula.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{formula.brief || "No brief yet"}</p>
        </motion.div>
        <div className="relative hidden text-xs text-muted-foreground sm:block">{formula.ingredients?.length ?? 0} materials</div>
        <div className="relative hidden sm:block"><StatusPill value={formula.status} /></div>
        <div className="relative hidden text-right font-mono-ui text-[10px] text-muted-foreground sm:block">
          {new Date(formula.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        <motion.div
          className="relative"
          variants={{ idle: { x: 0 }, hovered: { x: 4 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronRight size={15} className="text-muted-foreground" />
        </motion.div>
      </motion.div>
    </Link>
  );
}

// ── Dashboard: editorial formula row (minimal, hairline-rule list) ──
function DashboardFormulaRow({ formula, index }: { formula: Formula; index: number }) {
  const num = String(formula.id).padStart(3, "0");
  const name = formula.name || "Untitled";
  const updated = new Date(formula.updatedAt);
  const modified = updated.toDateString() === new Date().toDateString()
    ? "MODIFIED TODAY"
    : `MODIFIED ${updated.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase()}`;
  return (
    <Link href={`/formulas/${formula.id}`} data-testid={`row-dashboard-formula-${formula.id}`}>
      <motion.div
        className="group grid grid-cols-[32px_1fr_auto] items-baseline gap-4 border-t border-border py-4 sm:grid-cols-[32px_1fr_120px_auto] cursor-pointer"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
        whileHover="hovered"
      >
        <span className="font-mono-ui text-[9px] text-muted-foreground/60 tabular-nums">{num}</span>
        <span className="font-display text-xl uppercase leading-tight tracking-[-0.02em] transition-colors group-hover:text-accent">{name}</span>
        <span className="hidden font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground sm:block">{modified}</span>
        <motion.span
          className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground/50 transition-colors group-hover:text-foreground"
          variants={{ hovered: { x: 3 }, idle: { x: 0 } }}
          transition={{ duration: 0.2 }}
        >
          &rarr;
        </motion.span>
      </motion.div>
    </Link>
  );
}

// ── Spotlight: cursor-glow + parallax layers ──────────────
function SpotlightCard({ formula }: { formula: Formula }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });

  const titleX = useTransform(sx, [0, 1], [-12, 12]);
  const titleY = useTransform(sy, [0, 1], [-6, 6]);
  const statsX = useTransform(sx, [0, 1], [7, -7]);
  const glowL = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowT = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glowBg = useMotionTemplate`radial-gradient(420px circle at ${glowL} ${glowT}, hsl(var(--secondary) / 0.18) 0%, transparent 65%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <Link href={`/formulas/${formula.id}`} data-testid="link-spotlight-formula">
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
          className="group relative overflow-hidden bg-secondary/20"
        >
          {/* Cursor glow layer */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glowBg }} />

          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">
                  Formula {String(formula.id).padStart(3, "0")} · most recent
                </p>
                <StatusPill value={formula.status} />
                <StatusPill value={formula.ifraStatus} />
              </div>
              <motion.h2
                style={{ x: titleX, y: titleY }}
                className="mt-4 font-display text-[clamp(2.6rem,5.5vw,5.5rem)] leading-[.86] tracking-[-.03em] will-change-transform transition-colors duration-300 group-hover:text-accent"
              >
                {formula.name}
              </motion.h2>
              {formula.brief && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground line-clamp-2">{formula.brief}</p>
              )}
            </div>

            {/* Right: stats at opposite parallax depth */}
            <motion.div
              style={{ x: statsX }}
              className="flex shrink-0 flex-wrap items-end gap-6 lg:pb-1 will-change-transform"
            >
              <div className="text-right">
                <p className="font-display text-5xl">{formula.concentration}%</p>
                <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p>
              </div>
              <div className="border-l border-border pl-6">
                <p className="font-display text-5xl">{formula.ingredients.length}</p>
                <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">materials</p>
              </div>
              <motion.div
                className="flex items-center gap-1.5 pb-1 font-mono-ui text-[10px] uppercase tracking-widest transition-colors group-hover:text-accent"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Continue <ArrowUpRight size={13} />
              </motion.div>
            </motion.div>
          </div>

          {/* Ingredient strip — each cell lights up individually */}
          {formula.ingredients.length > 0 && (
            <div className="flex border-t border-border">
              {formula.ingredients.slice(0, 6).map((ing, i) => (
                <motion.div
                  key={i}
                  whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
                  className={`flex-1 px-3 py-3 min-w-0 ${i > 0 ? "border-l border-border" : ""}`}
                >
                  <p className="truncate font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{ing.materialName}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] text-foreground">{ing.grams}g</p>
                </motion.div>
              ))}
              {formula.ingredients.length > 6 && (
                <div className="border-l border-border px-3 py-3">
                  <p className="font-mono-ui text-[8px] text-muted-foreground">+{formula.ingredients.length - 6}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// StageTrack removed — dashboard uses editorial list layout instead.

// ── Scent of the day: full-width hero with cursor glow + parallax ──
function MaterialHero({ material }: { material: Material }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });

  const nameX = useTransform(sx, [0, 1], [-14, 14]);
  const nameY = useTransform(sy, [0, 1], [-6, 6]);
  const statsX = useTransform(sx, [0, 1], [8, -8]);
  const glowL = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowT = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glowBg = useMotionTemplate`radial-gradient(520px circle at ${glowL} ${glowT}, hsl(var(--secondary) / 0.22) 0%, transparent 62%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  const stripItems = [
    { label: "Family", value: material.family },
    { label: "Origin", value: material.origin },
    { label: "IFRA limit", value: `${material.ifraLimit}%` },
    { label: "Stock", value: material.inStock ? "In stock" : "To source" },
    { label: "Allergens", value: material.allergens.length > 0 ? material.allergens.length.toString() : "None flagged" },
    ...(material.casNumber ? [{ label: "CAS", value: material.casNumber }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-border"
    >
      <Link href={`/materials/${material.id}`} data-testid="link-material-hero">
        <div
          ref={cardRef}
          onMouseMove={onMove}
          onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
          className="group relative overflow-hidden bg-secondary/20"
        >
          {/* Background leaves image */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}images/leaves.jpg`}
              alt=""
              className="h-full w-full object-cover opacity-[0.08] mix-blend-luminosity grayscale"
            />
          </div>
          {/* Cursor glow */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: glowBg }} />

          {/* Main section */}
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left: name + meta + notes */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Scent of the day</p>
                <StatusPill value={material.safetyStatus} />
              </div>
              <motion.h2
                style={{ x: nameX, y: nameY }}
                className="mt-4 font-display text-[clamp(3rem,6.5vw,7.5rem)] leading-[.82] tracking-[-.03em] will-change-transform transition-colors duration-300 group-hover:text-accent"
              >
                {material.name}
              </motion.h2>
              <p className="mt-3 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                {material.family} · {material.origin}
              </p>
              {material.usageNotes && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground line-clamp-2">{material.usageNotes}</p>
              )}
            </div>

            {/* Right: IFRA + allergen count at opposite parallax depth */}
            <motion.div
              style={{ x: statsX }}
              className="flex shrink-0 flex-col gap-5 lg:items-end lg:pb-1 will-change-transform"
            >
              <div className="flex flex-wrap items-end gap-6">
                <div className="text-right">
                  <p className="font-display text-5xl">{material.ifraLimit}%</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">IFRA limit</p>
                </div>
                <div className="border-l border-border pl-6 text-right">
                  <p className="font-display text-5xl">{material.allergens.length}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase text-muted-foreground">allergen{material.allergens.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <motion.div
                className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase tracking-widest transition-colors group-hover:text-accent"
                whileHover={{ x: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                Browse library <ArrowUpRight size={13} />
              </motion.div>
            </motion.div>
          </div>

          {/* Metadata strip */}
          <div className="flex border-t border-border overflow-x-auto">
            {stripItems.map(({ label, value }, i) => (
              <motion.div
                key={label}
                whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
                className={`flex-1 min-w-[80px] px-4 py-3 ${i > 0 ? "border-l border-border" : ""}`}
              >
                <p className="whitespace-nowrap font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate font-mono-ui text-[9px] text-foreground">{value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// QuickPrompt kept for backwards-compat reference; Dashboard uses DashboardHero instead.

function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const formulasQuery = useListFormulas();
  const activityQuery = useGetActivity({ limit: 6 });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";
  }, []);

  const summary = summaryQuery.data;

  // ── Loading state ────────────────────────────────────────────
  if (summaryQuery.isLoading) return (
    <Shell>
      <div className="py-16 space-y-10 max-w-2xl">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    </Shell>
  );
  if (summaryQuery.isError || !summary) return <Shell><ErrorState retry={() => summaryQuery.refetch()} /></Shell>;

  const allFormulas = formulasQuery.data ?? summary.recentFormulas;
  const inProgress = allFormulas.filter(f => f.status === "draft" || f.status === "resting");
  const recentFormulas = summary.recentFormulas;
  const hasFormulas = summary.formulaCount > 0;
  const continueTarget = inProgress[0] ?? recentFormulas[0];

  return (
    <Shell>
      {/* ── HERO: greeting + continue action ────────────────────── */}
      <motion.section
        className="-mx-5 sm:-mx-8 lg:-mx-12 border-b border-border bg-background px-5 py-12 sm:px-8 sm:py-14 lg:px-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        data-testid="dashboard-hero"
      >
        <motion.p
          className="font-mono-ui text-[8px] uppercase tracking-[.36em] text-muted-foreground"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.04 }}
        >
          {greeting}
        </motion.p>
        <motion.h1
          data-testid="heading-dashboard-greeting"
          className="mt-3 font-display leading-[.88] tracking-[-0.04em] text-foreground"
          style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          Formula Library.
        </motion.h1>

        {/* ── PRIMARY ACTION: continue or create ────────────────── */}
        {hasFormulas && continueTarget ? (
          <motion.div
            className="mt-10 border-t border-border pt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18 }}
          >
            <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground mb-5">
              {inProgress.length > 0
                ? `${String(inProgress.length).padStart(2, "0")} formula${inProgress.length !== 1 ? "s" : ""} in progress`
                : "Continue"}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <Link
                href={`/formulas/${continueTarget.id}`}
                data-testid="link-dashboard-continue"
                className="group flex items-baseline gap-4"
              >
                <span className="font-display text-[clamp(1.5rem,3.5vw,2.6rem)] leading-tight tracking-[-0.03em] text-foreground transition-opacity group-hover:opacity-60">
                  {continueTarget.name || "Untitled"}
                  {continueTarget.id && (
                    <span className="ml-3 font-mono-ui text-[9px] font-normal uppercase tracking-[.18em] text-muted-foreground align-middle">
                      / {String(continueTarget.id).padStart(3, "0")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono-ui text-[10px] uppercase tracking-[.22em] text-muted-foreground transition-all group-hover:text-foreground group-hover:translate-x-1">
                  Continue →
                </span>
              </Link>
            </div>
            <div className="mt-7 border-t border-border pt-5">
              <Link
                href="/formulas/new"
                data-testid="button-new-formula"
                className="group inline-flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                New formula
                <Plus size={14} strokeWidth={1.5} className="transition-transform group-hover:rotate-90" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="mt-10 border-t border-border pt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18 }}
          >
            <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground mb-6">
              Begin here
            </p>
            <div className="flex flex-col gap-0 sm:flex-row sm:gap-0">
              {[
                { label: "Start with an idea", href: "/formulas/new", testId: "link-start-idea" },
                { label: "Explore materials", href: "/materials", testId: "link-explore-materials" },
                { label: "Formula library", href: "/formulas", testId: "link-browse-formulas" },
              ].map(({ label, href, testId }, i) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={testId}
                  className={`group flex items-center justify-between py-4 font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground transition-colors hover:text-foreground sm:flex-col sm:items-start sm:pr-10 ${i > 0 ? "border-t border-border sm:border-t-0 sm:border-l sm:pl-8" : ""}`}
                >
                  <span>{label}</span>
                  <ArrowRight size={10} className="sm:mt-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ── RECENT FORMULAS — editorial list ───────────────────── */}
      {hasFormulas && (
        <motion.section
          className="py-10"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          data-testid="section-recent-formulas"
        >
          <div className="flex items-center justify-between pb-2">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">
              RECENT
            </p>
            <Link
              href="/formulas"
              data-testid="link-view-all-formulas"
              className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>
          {/* List */}
          {recentFormulas.length > 0 ? (
            <div>
              {recentFormulas.slice(0, 8).map((formula, i) => (
                <DashboardFormulaRow key={formula.id} formula={formula} index={i} />
              ))}
            </div>
          ) : (
            <div className="border-t border-border py-14 text-center">
              <p className="font-display text-2xl text-muted-foreground/50">No formulas yet.</p>
            </div>
          )}
        </motion.section>
      )}

      {/* ── SUPPORTING TOOLS — minimal secondary strip ──────────── */}
      <motion.section
        className="border-t border-border py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.28 }}
        data-testid="section-tools"
      >
        <p className="mb-6 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">STUDIO TOOLS</p>
        <div className="grid grid-cols-1 border-b border-border sm:grid-cols-3">
          {[
            { label: "Materials", sub: `${summary.materialCount} in library`, href: "/materials", testId: "link-tool-materials" },
            { label: "IFRA", sub: summary.reviewCount > 0 ? `${summary.reviewCount} need review` : "Review formula safety", href: "/formulas?status=resting", testId: "link-tool-ifra" },
            { label: "Import", sub: "File drawer", href: "/files", testId: "link-tool-files" },
          ].map(({ label, sub, href, testId }, index) => (
            <Link
              key={href}
              href={href}
              data-testid={testId}
              className={`group flex items-end justify-between border-t border-border py-5 transition-colors hover:text-accent sm:px-5 ${index === 0 ? "sm:pl-0" : "sm:border-l"} ${index === 2 ? "sm:pr-0" : ""}`}
            >
              <div>
                <p className="font-display text-xl uppercase tracking-[-0.01em]">{label}</p>
                <p className="mt-1 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">{sub}</p>
              </div>
              <ArrowRight size={12} strokeWidth={1.5} className="mb-1 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── ACTIVITY LOG — quiet, collapsible feel ───────────────── */}
      {(activityQuery.data?.length ?? 0) > 0 && (
        <motion.section
          className="border-t border-border pb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          data-testid="section-activity"
        >
          <p className="py-6 font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">STUDIO LOG</p>
          {activityQuery.data!.slice(0, 6).map((ev, i) => (
            <div
              key={ev.id}
              data-testid={`row-activity-${ev.id}`}
              className="grid grid-cols-[80px_1fr] items-baseline gap-4 border-t border-border py-3 sm:grid-cols-[80px_1fr_140px]"
            >
              <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">
                {new Date(ev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="text-xs text-foreground/80">{ev.summary}</p>
              <p className="hidden font-mono-ui text-[8px] text-muted-foreground truncate sm:block">{ev.formulaName}</p>
            </div>
          ))}
        </motion.section>
      )}
    </Shell>
  );
}

function EmptyState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return <div className="my-4 py-16 text-center border border-border bg-secondary/30"><p className="mt-4 font-display text-3xl">{title}</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{copy}</p><div className="mt-6"><Button href={href} variant="outline" testId="button-empty-action">{label}</Button></div></div>;
}

function Formulas() {
  const [search, setSearch] = useState("");
  const rawSearch = useSearch();
  const urlStatus = new URLSearchParams(rawSearch).get("status") as "draft" | "resting" | "approved" | null;
  const [status, setStatus] = useState<"all" | "draft" | "resting" | "approved">(urlStatus ?? "all");
  const query = useListFormulas({ search: search || undefined, status: status === "all" ? undefined : status });
  const formulas = query.data ?? [];
  return (
    <Shell>
      {/* Atmospheric header banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative -mx-5 sm:-mx-8 lg:-mx-12 h-[120px] overflow-hidden border-b border-border"
      >
        <img
          src={`${import.meta.env.BASE_URL}images/molecule.jpg`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative flex h-full flex-col justify-center px-5 sm:px-8 lg:px-12">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.3em] text-muted-foreground">The notebook · all formulas</p>
          <p className="mt-1 font-mono-ui text-[9px] text-muted-foreground/60">A living record of each composition</p>
        </div>
      </motion.div>
      <PageHeader
        eyebrow="Library · formulas"
        title="Formula library"
        description="The living record of what you've made, paused, and almost made."
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/files" variant="outline" testId="button-library-import-file"><Paperclip size={13} /> Import file</Button>
            <Button href="/formulas/new" testId="button-library-new">New formula</Button>
          </div>
        }
      />
      <SectionRule label="Filter · search" />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or brief..." data-testid="input-formula-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-foreground/40" /></div><select value={status} data-testid="select-formula-status" className="border border-border bg-card px-4 py-3 text-xs outline-none focus:border-foreground/40" onChange={e => setStatus(e.target.value as typeof status)}><option value="all">All stages</option><option value="draft">Drafts</option><option value="resting">Resting</option><option value="approved">Approved</option></select></div>
      <div className="border border-border bg-card px-5 sm:px-7"><div className="hidden grid-cols-[1.5fr_1fr_110px_110px_24px] gap-4 border-b border-border py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground sm:grid"><span>Formula</span><span>Palette</span><span>Stage</span><span className="text-right">Changed</span><span /></div>{query.isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="my-5 h-14" />) : query.isError ? <ErrorState retry={() => query.refetch()} /> : formulas.length ? formulas.map(formula => <FormulaRow key={formula.id} formula={formula} />) : <EmptyState title="No formulas found." copy="Try another search, or give the next one a name." href="/formulas/new" label="Start a formula" />}</div>
    </Shell>
  );
}

function Materials() {
  const rawSearch = useSearch();
  const urlSearch = new URLSearchParams(rawSearch).get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);
  const query = useListMaterials({ search: search || undefined });
  const materials = query.data ?? [];
  return <Shell><PageHeader eyebrow="Library · raw materials" title="Materials" description="A tactile index of the things that make a formula feel alive." />
    <div className="mb-6 flex items-center gap-3"><div className="relative max-w-md flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials, families, origins..." data-testid="input-material-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-foreground/40" /></div><span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:block" data-testid="text-material-count">{materials.length} indexed</span></div>
    {query.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56" />)}</div> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{materials.map(material => <MaterialCard key={material.id} material={material} />)}{!materials.length && <div className="col-span-full"><EmptyState title="No materials in that drawer." copy="Try a different search term." href="/materials" label="Clear search" /></div>}</div>}
  </Shell>;
}

type StudioFile = {
  id: number;
  name: string;
  contentType: string;
  size: number;
  category: "formula" | "image" | "document" | "other";
  createdAt: string;
};

type FormulaFileAnalysis = {
  sourceFile: string;
  formulaName: string;
  concentration: number | null;
  totalMl: number | null;
  ingredientCount: number;
  ingredients: Array<{
    materialName: string;
    materialId: number | null;
    matchedName: string | null;
    percentage?: number;
    grams?: number;
    dilution?: number;
    role?: string;
    allergens: string[];
    ifraWarning: string | null;
  }>;
  allergens: string[];
  unknownMaterials: string[];
  ifraWarnings: Array<{ material: string; warning: string }>;
  interpretation: string;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const FILE_ACCEPT = "*/*";

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCategoryIcon({ category }: { category: StudioFile["category"] }) {
  const Icon = category === "image" ? FileImage : category === "formula" ? FlaskConical : category === "document" ? FileText : File;
  return <Icon size={17} strokeWidth={1.5} />;
}

function normaliseImportRole(role?: string): FormulaIngredientInput["role"] {
  return role === "top" || role === "heart" || role === "base" || role === "modifier" ? role : "modifier";
}

function canAnalyzeFormulaFile(file: StudioFile) {
  return file.category === "formula"
    || file.contentType.includes("pdf")
    || file.contentType.startsWith("text/")
    || /\.(pdf|txt)$/i.test(file.name);
}

function renderCoachInlineText(value: string): ReactNode {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-medium text-foreground">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>,
  );
}

function CoachReading({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-6">
      {text.split("\n").map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;
        const heading = line.match(/^#{1,3}\s+(.*)$/);
        if (heading) {
          return <p key={index} className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">{renderCoachInlineText(heading[1])}</p>;
        }
        if (/^[-*]\s+/.test(line)) {
          return <p key={index} className="flex gap-2"><span className="text-accent-foreground">—</span><span>{renderCoachInlineText(line.replace(/^[-*]\s+/, ""))}</span></p>;
        }
        return <p key={index}>{renderCoachInlineText(line)}</p>;
      })}
    </div>
  );
}

function ImportDisclosure({
  id,
  eyebrow,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`import-section-${id}`}
        data-testid={`button-toggle-import-${id}`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/30 sm:px-6"
      >
        <span className="min-w-0">
          <span className="block font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</span>
          <span className="mt-1 block font-display text-2xl">{title}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={`import-section-${id}`} className="border-t border-border px-5 py-5 sm:px-6">{children}</div>}
    </section>
  );
}

function FormulaImportReview({
  analysis,
  onClose,
}: {
  analysis: FormulaFileAnalysis;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const materialsQuery = useListMaterials();
  const materials = materialsQuery.data ?? [];
  const create = useCreateFormula();
  const [name, setName] = useState(analysis.formulaName);
  const [concentration, setConcentration] = useState(analysis.concentration ?? 20);
  const [totalMl, setTotalMl] = useState(analysis.totalMl ?? 30);
  const [confirmUnlinked, setConfirmUnlinked] = useState(false);
  const [openSection, setOpenSection] = useState<"reading" | "safety" | "details" | "materials">("reading");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>(() => analysis.ingredients.map((ingredient) => {
    const percentage = Math.max(0, ingredient.percentage ?? (ingredient.grams && totalMl > 0 ? (ingredient.grams / totalMl) * 100 : 0));
    const grams = Math.max(0, ingredient.grams ?? ((percentage / 100) * totalMl));
    return {
      materialId: ingredient.materialId ?? 0,
      materialName: ingredient.matchedName ?? ingredient.materialName,
      percentage: Number(percentage.toFixed(4)),
      grams: Number(grams.toFixed(3)),
      dilution: ingredient.dilution ?? 100,
      role: normaliseImportRole(ingredient.role),
      allergenFlags: ingredient.allergens,
    };
  }));
  const unmapped = ingredients.filter(ingredient => ingredient.materialId === 0);
  const totalPercentage = ingredients.reduce((total, ingredient) => total + ingredient.percentage, 0);
  const linkedCount = ingredients.length - unmapped.length;
  useEffect(() => {
    setIngredients(current => current.map(ingredient => ({
      ...ingredient,
      grams: Number(((ingredient.percentage / 100) * totalMl).toFixed(3)),
    })));
  }, [totalMl]);
  const updateIngredient = (index: number, patch: Partial<FormulaIngredientInput>) => {
    setIngredients(current => current.map((ingredient, ingredientIndex) => {
      if (ingredientIndex !== index) return ingredient;
      const next = { ...ingredient, ...patch };
      if (patch.grams !== undefined) next.percentage = totalMl > 0 ? Number(((next.grams / totalMl) * 100).toFixed(4)) : 0;
      if (patch.percentage !== undefined) next.grams = Number(((next.percentage / 100) * totalMl).toFixed(3));
      return next;
    }));
  };
  const removeIngredient = (index: number) => {
    setIngredients(current => current.filter((_, ingredientIndex) => ingredientIndex !== index));
    setEditingIndex(current => current === index ? null : current !== null && current > index ? current - 1 : current);
  };
  const addIngredient = () => {
    setIngredients(current => [...current, {
      materialId: 0,
      materialName: "New material",
      percentage: 0,
      grams: 0,
      dilution: 100,
      role: "modifier",
      allergenFlags: [],
    }]);
    setOpenSection("materials");
    setEditingIndex(ingredients.length);
  };
  const saveDraft = () => {
    if (!name.trim() || !ingredients.length || unmapped.length && !confirmUnlinked) return;
    create.mutate({
      data: {
        name: name.trim(),
        brief: `Imported from ${analysis.sourceFile}`,
        status: "draft",
        concentration,
        totalMl,
        notes: `Imported from ${analysis.sourceFile}.\n\nFormula file analysis:\n${analysis.interpretation}`,
        ingredients,
      },
    }, {
      onSuccess: formula => {
        qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation(`/formulas/${formula.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 px-4 py-6 backdrop-blur-sm sm:px-8" data-testid="modal-formula-import-review">
      <div className="mx-auto max-w-5xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-5 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Formula import · review before saving</p>
            <h2 className="mt-1 font-display text-4xl">Make it editable.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Source file: {analysis.sourceFile}. The original stays safely filed.</p>
          </div>
          <button onClick={onClose} aria-label="Close formula import" className="grid size-9 place-items-center border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-2 p-6 sm:p-8">
          <div className="mb-5 grid gap-2 sm:grid-cols-3">
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Materials</p><p className="mt-1 text-sm">{linkedCount} linked · {unmapped.length} to review</p></div>
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Composition</p><p className="mt-1 text-sm">{totalPercentage.toFixed(1)}% total</p></div>
            <div className="border border-border bg-secondary/20 px-4 py-3"><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Safety</p><p className="mt-1 text-sm">{analysis.allergens.length} allergen · {analysis.ifraWarnings.length} IFRA note{analysis.ifraWarnings.length === 1 ? "" : "s"}</p></div>
          </div>
          <ImportDisclosure id="reading" eyebrow="01 · Coach reading" title="What the file suggests" summary="Interpretation, facets, and overall effect" open={openSection === "reading"} onToggle={() => setOpenSection(openSection === "reading" ? "details" : "reading")}>
            <CoachReading text={analysis.interpretation} />
          </ImportDisclosure>
          <ImportDisclosure id="safety" eyebrow="02 · Safety review" title="What needs attention" summary={`${analysis.allergens.length} allergen note${analysis.allergens.length === 1 ? "" : "s"} · ${analysis.ifraWarnings.length} IFRA item${analysis.ifraWarnings.length === 1 ? "" : "s"} · ${analysis.unknownMaterials.length} unknown`} open={openSection === "safety"} onToggle={() => setOpenSection(openSection === "safety" ? "details" : "safety")}>
            <div className="grid gap-5 md:grid-cols-3">
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Known allergens</p>{analysis.allergens.length ? <div className="mt-3 flex flex-wrap gap-2">{analysis.allergens.map(allergen => <span key={allergen} className="border border-accent/40 bg-accent/10 px-2 py-1 text-xs">{allergen}</span>)}</div> : <p className="mt-3 text-sm text-muted-foreground">None detected.</p>}</div>
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">Unknown materials</p>{analysis.unknownMaterials.length ? <div className="mt-3 space-y-2 text-sm">{analysis.unknownMaterials.map(material => <p key={material}>· {material}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Everything matched your library.</p>}</div>
              <div><p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground">IFRA review</p>{analysis.ifraWarnings.length ? <div className="mt-3 space-y-3 border-l-2 border-destructive/60 bg-destructive/5 px-3 py-2 text-xs leading-5 text-muted-foreground">{analysis.ifraWarnings.map(item => <p key={item.material}><strong className="text-foreground">{item.material}:</strong> {item.warning}</p>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No flagged items.</p>}</div>
            </div>
          </ImportDisclosure>
          <ImportDisclosure id="details" eyebrow="03 · Draft details" title="Name the working formula" summary={`${concentration}% concentration · ${totalMl} ml batch`} open={openSection === "details"} onToggle={() => setOpenSection(openSection === "details" ? "reading" : "details")}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <label className="block text-xs font-medium">Formula name<input value={name} onChange={event => setName(event.target.value)} data-testid="input-import-formula-name" className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
              <label className="block text-xs font-medium">Concentration %<input type="number" min="0" max="100" value={concentration} onChange={event => setConcentration(Number(event.target.value))} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
              <label className="block text-xs font-medium">Batch size ml<input type="number" min="0" value={totalMl} onChange={event => setTotalMl(Number(event.target.value))} className="mt-2 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label>
            </div>
          </ImportDisclosure>
          <ImportDisclosure id="materials" eyebrow="04 · Confirm the palette" title="Edit each material" summary={`${ingredients.length} rows · ${linkedCount} linked · ${unmapped.length} unlinked`} open={openSection === "materials"} onToggle={() => setOpenSection(openSection === "materials" ? "details" : "materials")}>
            <p className="max-w-3xl text-xs leading-5 text-muted-foreground">Open Edit to correct an imported name, map it to your library, change its amount or role, or delete a row that does not belong in this formula.</p>
            <div className="mt-5 space-y-2">
              {ingredients.map((ingredient, index) => {
                const isEditing = editingIndex === index;
                return (
                  <div key={`${ingredient.materialName}-${index}`} className={`border ${isEditing ? "border-foreground/40 bg-secondary/30" : "border-border bg-secondary/20"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{ingredient.materialName}</p>
                          {ingredient.materialId === 0 && <span className="border border-accent/40 px-1.5 py-0.5 font-mono-ui text-[8px] uppercase tracking-widest text-accent-foreground/70">Unlinked</span>}
                        </div>
                        <p className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">{ingredient.percentage.toFixed(2)}% · {ingredient.grams.toFixed(3)}g · {ingredient.role}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => setEditingIndex(isEditing ? null : index)} aria-expanded={isEditing} data-testid={`button-edit-import-material-${index}`} className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-2 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:border-foreground"><Pencil size={12} /> {isEditing ? "Done" : "Edit"}</button>
                        <button type="button" onClick={() => removeIngredient(index)} aria-label={`Delete ${ingredient.materialName}`} data-testid={`button-delete-import-material-${index}`} className="inline-flex items-center gap-1.5 border border-destructive/30 px-2.5 py-2 font-mono-ui text-[9px] uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"><Trash2 size={12} /> Delete</button>
                      </div>
                    </div>
                    {isEditing && <div className="grid gap-3 border-t border-border px-3 py-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_88px_76px_100px]">
                      <label className="min-w-0 text-xs font-medium">Imported name<input value={ingredient.materialName} onChange={event => updateIngredient(index, { materialName: event.target.value })} data-testid={`input-edit-import-name-${index}`} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="min-w-0 text-xs font-medium">Library match
                        <select value={ingredient.materialId} onChange={event => {
                          const materialId = Number(event.target.value);
                          const material = materials.find(item => item.id === materialId);
                          updateIngredient(index, { materialId, materialName: material?.name ?? ingredient.materialName, allergenFlags: material?.allergens ?? [] });
                        }} data-testid={`select-import-material-${index}`} className="mt-1 w-full truncate border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40">
                          <option value={0}>Keep unlinked</option>
                          {materials.map(material => <option key={material.id} value={material.id}>{material.name}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-medium">%<input type="number" min="0" step="0.001" value={ingredient.percentage} onChange={event => updateIngredient(index, { percentage: Number(event.target.value) })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="text-xs font-medium">g<input type="number" min="0" step="0.001" value={ingredient.grams} onChange={event => updateIngredient(index, { grams: Number(event.target.value) })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40" /></label>
                      <label className="text-xs font-medium">Role<select value={ingredient.role} onChange={event => updateIngredient(index, { role: event.target.value as FormulaIngredientInput["role"] })} className="mt-1 w-full border border-border bg-background px-2 py-2 text-xs outline-none focus:border-foreground/40"><option value="top">Top</option><option value="heart">Heart</option><option value="base">Base</option><option value="modifier">Modifier</option></select></label>
                    </div>}
                  </div>
                );
              })}
              {ingredients.length === 0 && <div className="border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No materials remain in this draft.</div>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={addIngredient} data-testid="button-add-import-material" className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono-ui text-[9px] uppercase tracking-widest transition-colors hover:border-foreground"><Plus size={13} /> Add material</button>
              <p className="font-mono-ui text-[10px] text-muted-foreground">{totalPercentage.toFixed(1)}% total</p>
            </div>
            {unmapped.length > 0 && <label className="mt-4 flex items-start gap-3 border border-accent/30 bg-accent/10 p-4 text-xs leading-5">
              <input type="checkbox" checked={confirmUnlinked} onChange={event => setConfirmUnlinked(event.target.checked)} className="mt-0.5" data-testid="checkbox-confirm-unlinked-import" />
              <span><strong className="text-foreground">{unmapped.length} material{unmapped.length === 1 ? "" : "s"} remain unlinked.</strong> I understand they will be saved as editable names and need resolving in the Formula Builder.</span>
            </label>}
            {create.isError && <p className="mt-3 text-sm text-destructive" data-testid="status-import-formula-error">The draft could not be saved. Check the amounts and try again.</p>}
          </ImportDisclosure>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-5 sm:px-8">
          <p className="text-xs text-muted-foreground">Saving creates a new editable draft and never deletes {analysis.sourceFile}.</p>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="quiet" testId="button-cancel-formula-import">Cancel</Button>
            <Button onClick={saveDraft} disabled={!name.trim() || !ingredients.length || (!!unmapped.length && !confirmUnlinked) || create.isPending} testId="button-save-imported-formula">{create.isPending ? "Saving draft…" : "Save editable draft"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileDrawer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FormulaFileAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzingFileId, setAnalyzingFileId] = useState<number | null>(null);
  const search = useSearch();
  const autoAnalyzeId = Number(new URLSearchParams(search).get("analyze")) || null;
  const autoAnalyzedRef = useRef<number | null>(null);
  const filesQuery = useQuery({
    queryKey: ["studio-files"],
    queryFn: async (): Promise<StudioFile[]> => {
      const response = await fetch("/api/uploads", { credentials: "include" });
      if (!response.ok) throw new Error("Could not load your files.");
      return response.json();
    },
  });
  const deleteFile = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/uploads/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete this file.");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-files"] }),
  });
  const analyzeFile = useCallback(async (file: StudioFile) => {
    setAnalysisError(null);
    setAnalyzingFileId(file.id);
    try {
      const response = await fetch(`/api/uploads/${file.id}/analyze`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({})) as FormulaFileAnalysis & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "This file could not be analyzed.");
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "This file could not be analyzed.");
    } finally {
      setAnalyzingFileId(null);
    }
  }, []);

  useEffect(() => {
    if (!autoAnalyzeId || autoAnalyzedRef.current === autoAnalyzeId || !filesQuery.data) return;
    const file = filesQuery.data.find(item => item.id === autoAnalyzeId);
    if (!file) return;
    autoAnalyzedRef.current = autoAnalyzeId;
    if (canAnalyzeFormulaFile(file)) void analyzeFile(file);
    else setAnalysisError(`${file.name} is saved in the drawer, but only JSON, CSV, text, and text-based PDF formula files can be turned into editable drafts.`);
  }, [analyzeFile, autoAnalyzeId, filesQuery.data]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => file.size > 0 && file.size <= MAX_UPLOAD_BYTES);
    const rejected = files.length - validFiles.length;
    setUploadError(rejected ? "Files must be between 1 byte and 25 MB." : null);
    if (!validFiles.length) return;

    setUploading(validFiles.map(file => file.name));
    for (const file of validFiles) {
      try {
        const requestResponse = await fetch("/api/uploads/request-url", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
        });
        if (!requestResponse.ok) {
          const data = await requestResponse.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not prepare this upload.");
        }
        const requested = await requestResponse.json() as { uploadUrl: string; objectKey: string; category: StudioFile["category"] };
        const stored = await fetch(requested.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!stored.ok) throw new Error("The file could not be saved to storage.");

        const completeResponse = await fetch("/api/uploads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            objectKey: requested.objectKey,
            category: requested.category,
          }),
        });
        if (!completeResponse.ok) throw new Error("The upload finished, but could not be added to your file drawer.");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "This upload could not be completed.");
      } finally {
        setUploading(current => current.filter(name => name !== file.name));
      }
    }
    qc.invalidateQueries({ queryKey: ["studio-files"] });
  }, [qc]);

  return (
    <Shell>
      <PageHeader eyebrow="Studio archive" title="File drawer" description="Keep formula exports, evaluation photos, supplier sheets, and every useful reference close to the work." />
      <section className="py-8">
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={FILE_ACCEPT}
          multiple
          onChange={event => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
          data-testid="input-file-upload"
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
          onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={event => { if (event.currentTarget === event.target) setIsDragging(false); }}
          onDrop={event => {
            event.preventDefault();
            setIsDragging(false);
            void uploadFiles(Array.from(event.dataTransfer.files));
          }}
          className={`group grid cursor-pointer place-items-center border px-6 py-14 text-center transition-colors ${isDragging ? "border-foreground bg-secondary/40" : "border-dashed border-border bg-secondary/15 hover:border-foreground/40 hover:bg-secondary/30"}`}
          data-testid="dropzone-file-upload"
          aria-label="Upload files"
        >
          <div className="grid size-12 place-items-center border border-border bg-background transition-transform duration-200 group-hover:-translate-y-0.5">
            <Upload size={18} strokeWidth={1.5} />
          </div>
          <p className="mt-5 font-display text-3xl">Add to the drawer.</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Drop files here or browse. Formula exports, photos, PDFs, spreadsheets, and studio notes are all welcome.</p>
          <p className="mt-4 font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground/70">Images · PDF · CSV · JSON · Word · Excel · text · 25 MB each</p>
        </div>

        {(uploading.length > 0 || uploadError) && (
          <div className="mt-4 border border-border bg-card px-5 py-4">
            {uploading.map(name => <p key={name} className="flex items-center gap-2 text-sm"><span className="size-2 animate-pulse bg-foreground" /> Uploading {name}…</p>)}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
        )}
      </section>

      <SectionRule label="Saved files" />
      {analysisError && <div className="mb-4 flex items-start justify-between gap-4 border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive" data-testid="status-file-analysis-error"><span>{analysisError}</span><button onClick={() => setAnalysisError(null)} aria-label="Dismiss file analysis error"><X size={14} /></button></div>}
      {filesQuery.isLoading ? (
        <div className="space-y-px border border-border">{[1, 2, 3].map(item => <Skeleton key={item} className="h-20 w-full" />)}</div>
      ) : filesQuery.isError ? <ErrorState retry={() => filesQuery.refetch()} /> : filesQuery.data?.length ? (
        <div className="border border-border bg-card">
          {filesQuery.data.map((file, index) => (
            <div key={file.id} className={`group flex items-center gap-4 px-5 py-4 ${index ? "border-t border-border" : ""}`}>
              <div className="grid size-10 shrink-0 place-items-center border border-border bg-secondary/30 text-muted-foreground"><FileCategoryIcon category={file.category} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="mt-1 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground">{file.category} · {fileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
               {canAnalyzeFormulaFile(file) && <button
                 onClick={() => void analyzeFile(file)}
                 disabled={analyzingFileId === file.id}
                 className="shrink-0 border border-border px-3 py-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                 data-testid={`button-analyze-file-${file.id}`}
               >{analyzingFileId === file.id ? "Reading…" : "Analyze & draft"}</button>}
              <a href={`/api/uploads/${file.id}/download`} className="grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={`Download ${file.name}`} data-testid={`button-download-file-${file.id}`}><Download size={15} strokeWidth={1.5} /></a>
              <button
                onClick={() => {
                  if (window.confirm(`Delete “${file.name}”? This cannot be undone.`)) deleteFile.mutate(file.id);
                }}
                disabled={deleteFile.isPending}
                className="grid size-9 place-items-center text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${file.name}`}
                data-testid={`button-delete-file-${file.id}`}
              ><Trash2 size={14} strokeWidth={1.5} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-3xl">Nothing filed yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start with a formula export, a reference image, or the evaluation notes from your last trial.</p>
        </div>
      )}
      {analysis && <FormulaImportReview key={analysis.sourceFile} analysis={analysis} onClose={() => setAnalysis(null)} />}
    </Shell>
  );
}

async function uploadStudioFile(file: File): Promise<StudioFile> {
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new Error("Choose a file between 1 byte and 25 MB.");
  const requestResponse = await fetch("/api/uploads/request-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
  });
  const requested = await requestResponse.json().catch(() => ({})) as { uploadUrl?: string; objectKey?: string; category?: StudioFile["category"]; error?: string };
  if (!requestResponse.ok || !requested.uploadUrl || !requested.objectKey || !requested.category) throw new Error(requested.error ?? "Could not prepare this upload.");

  const stored = await fetch(requested.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!stored.ok) throw new Error("The file could not be saved to storage.");

  const completeResponse = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      objectKey: requested.objectKey,
      category: requested.category,
    }),
  });
  const saved = await completeResponse.json().catch(() => ({})) as StudioFile & { error?: string };
  if (!completeResponse.ok || !saved.id) throw new Error(saved.error ?? "The upload finished, but could not be added to your file drawer.");
  return saved;
}

function FormulaToolFileUpload({ testId }: { testId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [saved, setSaved] = useState<StudioFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const selectFile = async (file: File) => {
    setStatus(null);
    setSaved(null);
    setIsUploading(true);
    try {
      const fileRecord = await uploadStudioFile(file);
      setSaved(fileRecord);
      qc.invalidateQueries({ queryKey: ["studio-files"] });
      setStatus(canAnalyzeFormulaFile(fileRecord)
        ? "Formula source filed. Review it before making the editable draft."
        : "Reference filed. It is available in your File Drawer and Creative Lab.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "This file could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="text-right">
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        data-testid={`${testId}-input`}
        onChange={event => {
          const [file] = Array.from(event.target.files ?? []);
          if (file) void selectFile(file);
          event.target.value = "";
        }}
      />
      <Button onClick={() => inputRef.current?.click()} variant="outline" disabled={isUploading} testId={testId}>
        <Paperclip size={13} /> {isUploading ? "Filing…" : "Upload a file"}
      </Button>
      {status && <p className={`mt-2 max-w-xs text-xs leading-5 ${saved ? "text-muted-foreground" : "text-destructive"}`} data-testid={`${testId}-status`}>{status}</p>}
      {saved && <Link href={canAnalyzeFormulaFile(saved) ? `/files?analyze=${saved.id}` : "/files"} className="mt-2 inline-block text-[10px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid={`${testId}-review`}>
        {canAnalyzeFormulaFile(saved) ? "Review & make draft ↗" : "Open File Drawer ↗"}
      </Link>}
    </div>
  );
}

const BASE_MOODS = [
  { name: "Clean",  prompt: "A clean, transparent skin scent — no soap, just presence",  img: "/images/mood-clean.jpg",  families: ["musk"] },
  { name: "Warm",   prompt: "A warm, resinous amber with depth and sensuality",          img: "/images/mood-warm.jpg",   families: ["resinous", "spicy"] },
  { name: "Dark",   prompt: "A dark, smoky, almost feral composition",                   img: "/images/mood-dark.jpg",   families: ["woody", "resinous"] },
  { name: "Fresh",  prompt: "A luminous fresh green accord — dew, herbs, cut stems",     img: "/images/mood-fresh.jpg",  families: ["green", "fresh", "citrus"] },
  { name: "Floral", prompt: "A romantic, heady white floral that lingers",               img: "/images/mood-floral.jpg", families: ["floral"] },
  { name: "Woody",  prompt: "A dry, cerebral woody accord — sandalwood, cedar, vetiver", img: "/images/mood-woody.jpg",  families: ["woody"] },
] as const;

const BASE_ACCORDS = [
  { name: "Clean Musk",       desc: "Soft. Transparent. Skin-like.",  icon: Sparkles, families: ["musk"] },
  { name: "Amber Woods",      desc: "Warm. Resinous. Addictive.",     icon: Leaf,     families: ["resinous", "woody"] },
  { name: "Fresh Citrus",     desc: "Bright. Zesty. Uplifting.",      icon: Beaker,   families: ["citrus"] },
  { name: "Modern Patchouli", desc: "Earthy. Textured. Refined.",     icon: Leaf,     families: ["woody"] },
  { name: "White Florals",    desc: "Luminous. Heady. Sensual.",      icon: Sparkles, families: ["floral"] },
  { name: "Chypre",           desc: "Mossy. Elegant. Complex.",       icon: Beaker,   families: ["green", "citrus"] },
] as const;

const FAMILY_WASH: Record<string, { bg: string; img: string; pos: string }> = {
  citrus:    { bg: "bg-secondary",  img: "botanicals.jpg", pos: "center top"    },
  floral:    { bg: "bg-accent/30",  img: "jasmine.jpg",    pos: "center"        },
  woody:     { bg: "bg-secondary",  img: "leaves.jpg",     pos: "center bottom" },
  resinous:  { bg: "bg-muted",      img: "resin.jpg",      pos: "center"        },
  fresh:     { bg: "bg-secondary",  img: "botanicals.jpg", pos: "top left"      },
  musk:      { bg: "bg-accent/20",  img: "molecule.jpg",   pos: "center"        },
  spicy:     { bg: "bg-muted",      img: "spice.jpg",      pos: "center"        },
  green:     { bg: "bg-secondary",  img: "leaves.jpg",     pos: "bottom"        },
};

function MaterialCard({ material }: { material: Material }) {
  const familyKey = normalizeMaterialFamilies(material.family)[0] ?? "";
  const wash = FAMILY_WASH[familyKey] ?? { bg: "bg-secondary", img: "botanicals.jpg", pos: "center" };
  return (
    <Link href={`/materials/${material.id}`} data-testid={`card-material-${material.id}`}>
      <article className="group relative border border-border bg-card overflow-hidden p-5 transition-colors hover:bg-secondary/20">
        {/* Tinted background image */}
        <img
          src={`${import.meta.env.BASE_URL}images/${wash.img}`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] mix-blend-multiply"
          style={{ objectPosition: wash.pos }}
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className={`grid size-10 place-items-center ${wash.bg} text-foreground`}>
              <Leaf size={18} strokeWidth={1.5} />
            </div>
            <StatusPill value={material.safetyStatus} />
          </div>
          <h3 className="mt-5 font-display text-2xl leading-none" data-testid={`text-material-name-${material.id}`}>{material.name}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{material.family} · {material.origin}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-ui text-[9px] uppercase tracking-[.11em] text-muted-foreground">
            <span>IFRA {material.ifraLimit}%</span>
            <span>{material.inStock ? "In stock" : "To source"}</span>
          </div>
          {material.usageNotes && (
            <p className="mt-3 text-xs leading-5 text-muted-foreground line-clamp-2">{material.usageNotes}</p>
          )}
          <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/50">
            Read more →
          </p>
        </div>
      </article>
    </Link>
  );
}

function MaterialCombobox({ materials, value, onChange, index }: {
  materials: Material[];
  value: { materialId: number; materialName: string };
  onChange: (materialId: number, materialName: string) => void;
  index: number;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? materials.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.family.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40)
    : materials.slice(0, 40);

  const isAiSuggested = value.materialId === 0 && value.materialName.length > 0;
  const selectedName = value.materialName;

  return (
    <div ref={ref} className="relative min-w-0">
      <div className={`flex items-center border bg-card ${isAiSuggested && !open ? "border-accent/40" : "border-border"}`}>
        <Search size={12} className="ml-3 shrink-0 text-muted-foreground" />
        <input
          type="text"
          data-testid={`select-ingredient-material-${index}`}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-muted-foreground/50"
          placeholder="Search material…"
          value={open ? query : selectedName}
          onFocus={() => { setOpen(true); setQuery(isAiSuggested ? value.materialName : ""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {!open && value.materialId > 0 && (
          <span className="mr-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60">
            {materials.find(m => m.id === value.materialId)?.family ?? ""}
          </span>
        )}
        {!open && isAiSuggested && (
          <span className="mr-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-accent/70">AI</span>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 max-h-52 overflow-y-auto border border-t-0 border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">No materials found.</p>
          ) : (
            filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onMouseDown={() => { onChange(m.id, m.name); setQuery(""); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-secondary ${m.id === value.materialId ? "bg-secondary font-medium" : ""}`}
              >
                <span>{m.name}</span>
                <span className="ml-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-wider text-muted-foreground/60">{m.family}</span>
              </button>
            ))
          )}
          {!query && materials.length > 40 && (
            <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">Type to search all {materials.length} materials</p>
          )}
        </div>
      )}
    </div>
  );
}

function IngredientBuilder({
  ingredients, setIngredients, totalMl, concentration,
}: {
  ingredients: FormulaIngredientInput[];
  setIngredients: (next: FormulaIngredientInput[]) => void;
  totalMl: number;
  concentration: number;
}) {
  const materialsQuery = useListMaterials();
  const materials = materialsQuery.data ?? [];

  useEffect(() => {
    const next = ingredients.map(ingredient => ({
      ...ingredient,
      grams: parseFloat(((ingredient.percentage / 100) * totalMl).toFixed(3)),
    }));
    const changed = next.some((ingredient, index) => ingredient.grams !== ingredients[index]?.grams);
    if (changed) setIngredients(next);
  }, [totalMl]);

  const add = () => setIngredients([...ingredients, { materialId: 0, materialName: "", percentage: 0, grams: 0, dilution: 100, role: "heart" }]);

  const update = (index: number, patch: Partial<FormulaIngredientInput>) => {
    setIngredients(ingredients.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      if ("grams" in patch) {
        // Ingredient percentages describe the finished batch. Their total
        // should match the formula's target concentration.
        next.percentage = totalMl > 0 ? parseFloat(((next.grams / totalMl) * 100).toFixed(4)) : 0;
      } else {
        // percentage changed (e.g. programmatic) — keep grams in sync
        next.grams = parseFloat(((next.percentage / 100) * totalMl).toFixed(3));
      }
      return next;
    }));
  };

  const totalPct = Math.round(ingredients.reduce((s, ing) => s + (ing.percentage || 0), 0) * 10) / 10;

  return (
    <div className="border border-border bg-card p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The palette</p>
          <h2 className="mt-1 font-display text-3xl">Materials in the blend</h2>
        </div>
        <Button onClick={add} variant="outline" testId="button-add-ingredient">Add material</Button>
      </div>
      {materialsQuery.isLoading && <p className="mt-4 text-xs text-muted-foreground">Loading material library…</p>}

      <div className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {ingredients.map((ingredient, index) => {
            const dilution = ingredient.dilution ?? 100;
            const grams = ingredient.grams;
            const activeGrams = parseFloat((grams * dilution / 100).toFixed(3));
            const pctOfConc = concentration > 0 ? Math.round((ingredient.percentage / concentration) * 1000) / 10 : 0;

            return (
              <motion.div
                key={`${index}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 16, transition: { duration: 0.14 } }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-secondary/60 p-4"
              >
                {/* Material search */}
                <MaterialCombobox
                  materials={materials}
                  value={{ materialId: ingredient.materialId, materialName: ingredient.materialName }}
                  onChange={(materialId, materialName) => update(index, { materialId, materialName })}
                  index={index}
                />

                {/* Controls row */}
                <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_28px] gap-2">
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
                      Grams{ingredient.grams > 0 && (
                        <span className="ml-2 text-foreground">{ingredient.percentage}%</span>
                      )}
                    </span>
                    <input
                      type="number" min="0" step="0.001"
                      value={ingredient.grams}
                      onChange={e => update(index, { grams: Number(e.target.value) })}
                      data-testid={`input-ingredient-percentage-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Dilution %</span>
                    <input
                      type="number" min="0" max="100" step="1"
                      value={ingredient.dilution ?? 100}
                      onChange={e => update(index, { dilution: Number(e.target.value) })}
                      data-testid={`input-ingredient-dilution-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                      placeholder="100"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Role</span>
                    <select
                      value={ingredient.role}
                      onChange={e => update(index, { role: e.target.value as FormulaIngredientInput["role"] })}
                      data-testid={`select-ingredient-role-${index}`}
                      className="mt-1 w-full border border-border bg-card px-2 py-2 text-xs outline-none transition-colors focus:border-foreground/40"
                    >
                      <option value="top">Top</option>
                      <option value="heart">Heart</option>
                      <option value="base">Base</option>
                      <option value="modifier">Modifier</option>
                    </select>
                  </label>
                  <div className="flex items-end">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                      data-testid={`button-remove-ingredient-${index}`}
                      className="mb-0.5 grid h-[30px] w-full place-items-center text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Minus size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Weight / quantity row */}
                {grams > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      {/* Progress bar — width driven by % of formula */}
                      <div className="h-[2px] flex-1 overflow-hidden bg-border">
                        <motion.div
                          className="h-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(ingredient.percentage, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex shrink-0 gap-3 font-mono-ui text-[9px] text-muted-foreground">
                        <span title="Share of the formula by weight">
                          <strong className="text-foreground">{ingredient.percentage}%</strong> of formula
                        </span>
                        {dilution < 100 && (
                          <span title={`${activeGrams}g is pure aromatic material; the rest is solvent`}>{activeGrams}g active</span>
                        )}
                        {concentration > 0 && (
                          <span title={`Share of the formula's ${concentration}% aromatic concentrate`}>{pctOfConc}% of conc.</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!ingredients.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-border p-8 text-center text-xs text-muted-foreground"
          >
            No materials yet. Add the first thread.
          </motion.div>
        )}
      </div>

      {/* Running total */}
      {ingredients.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-between border-t border-border pt-4"
        >
          <div className="flex items-center gap-2">
            <div className="h-[3px] w-24 overflow-hidden bg-border">
              <motion.div
                className={`h-full ${totalPct > concentration ? "bg-destructive" : Math.abs(totalPct - concentration) <= 0.1 ? "bg-accent" : "bg-foreground"}`}
                animate={{ width: `${concentration > 0 ? Math.min((totalPct / concentration) * 100, 100) : 0}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className={`font-mono-ui text-[10px] ${totalPct > concentration ? "text-destructive" : Math.abs(totalPct - concentration) <= 0.1 ? "text-accent-foreground" : "text-muted-foreground"}`}>
              {totalPct}% of {concentration}% target
            </span>
          </div>
          {totalPct > concentration && <span className="font-mono-ui text-[9px] text-destructive">Exceeds concentration</span>}
          {Math.abs(totalPct - concentration) <= 0.1 && <span className="font-mono-ui text-[9px] text-accent-foreground">Palette complete</span>}
          {totalPct > 0 && totalPct < concentration && (
            <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round((concentration - totalPct) * 10) / 10}% remaining</span>
          )}
        </motion.div>
      )}
    </div>
  );
}

type FormulaIdeaMaterial = { name: string; role: "top" | "heart" | "base"; pct: number };
type FormulaIdea = { name: string; brief: string; direction: string };

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

function useTypewriter(phrases: string[]) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (charIdx < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        }, 38);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 1800);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), 400);
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        }, 18);
      } else {
        setPhraseIdx(i => (i + 1) % phrases.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [phase, charIdx, phraseIdx, phrases]);

  return displayed;
}

const ROLE_META: Record<string, { label: string; barOpacity: string; dotColor: string }> = {
  top:   { label: "Top",   barOpacity: "opacity-90", dotColor: "bg-white/80" },
  heart: { label: "Heart", barOpacity: "opacity-60", dotColor: "bg-white/55" },
  base:  { label: "Base",  barOpacity: "opacity-35", dotColor: "bg-white/35" },
};

function MaterialBars({ materials }: { materials: FormulaIdeaMaterial[] }) {
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

function IdeaDrawer({ idea, onStart, onClose }: { idea: FormulaIdea; onStart: (materials: FormulaIdeaMaterial[]) => void; onClose: () => void }) {
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

function FormulaIdeaGenerator({ onSelect }: { onSelect: (name: string, brief: string, materials: FormulaIdeaMaterial[]) => void }) {
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
function matchBlueprintToLibrary(
  ingredients: FormulaIngredientInput[],
  materials: Material[],
): FormulaIngredientInput[] {
  if (!materials.length) return ingredients;
  return ingredients.map(ing => {
    if (ing.materialId !== 0 || !ing.materialName) return ing;
    const nameLower = ing.materialName.toLowerCase();
    // 1. Case-insensitive exact match
    let match = materials.find(m => m.name.toLowerCase() === nameLower);
    // 2. Fuzzy fallback: library name contains AI name, or vice-versa
    if (!match) {
      match = materials.find(
        m =>
          m.name.toLowerCase().includes(nameLower) ||
          nameLower.includes(m.name.toLowerCase()),
      );
    }
    if (match) return { ...ing, materialId: match.id, materialName: match.name };
    return ing;
  });
}

function BlueprintPanel({ materials }: { materials: FormulaIdeaMaterial[] }) {
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

function NewFormula() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const create = useCreateFormula();
  const qc = useQueryClient();
  const [name, setName] = useState(params.get("name") ?? "");
  const [brief, setBrief] = useState(params.get("brief") ?? "");
  const [concentration, setConcentration] = useState(20);
  const [totalMl, setTotalMl] = useState(30);
  const [notes, setNotes] = useState("");
  const [ifraCategory, setIfraCategory] = useState("");
  const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>(() => {
    try {
      const stored = sessionStorage.getItem("matiere-blueprint");
      if (stored) {
        sessionStorage.removeItem("matiere-blueprint");
        const mats: FormulaIdeaMaterial[] = JSON.parse(stored);
        return mats.map(mat => ({
          materialId: 0,
          materialName: mat.name,
          percentage: mat.pct * 0.2,
          grams: parseFloat(((mat.pct / 100) * 30 * 0.2).toFixed(3)),
          dilution: 100,
          role: mat.role,
        }));
      }
    } catch {}
    return [];
  });

  // Fetch the material library so we can auto-match blueprint ingredients.
  // React Query deduplicates this request — IngredientBuilder makes the same call.
  const libraryQuery = useListMaterials();
  const libraryMaterials = libraryQuery.data ?? [];

  // One-shot auto-match: fires once when the library first loads. Guards via ref
  // so it won't re-run if the user manually edits ingredients afterwards.
  const blueprintMatchedRef = useRef(false);
  useEffect(() => {
    if (blueprintMatchedRef.current || !libraryMaterials.length) return;
    blueprintMatchedRef.current = true;
    setIngredients(prev => matchBlueprintToLibrary(prev, libraryMaterials));
  }, [libraryMaterials]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { data: { name, brief, status: "draft", concentration, totalMl, notes, ifraCategory: ifraCategory || undefined, ingredients } },
      { onSuccess: formula => {
        qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation(`/formulas/${formula.id}?stage=formulate`);
      }}
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Formula lab · new"
        title="Start here."
        description="Name it, describe the intention, then build out the palette. Everything can be revised."
        action={<FormulaToolFileUpload testId="button-new-formula-upload-file" />}
      />
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-5">
          {/* Intention — always visible first */}
          <div className="border border-border bg-card p-6 sm:p-7">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Intention</p>
            <label className="mt-5 block text-xs font-medium">Name
              <input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" placeholder="A name with a little weather" />
            </label>
            <label className="mt-7 block text-xs font-medium">Brief <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="The feeling, the direction, the thing you're after." />
            </label>
            <label className="mt-7 block text-xs font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-20 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, what to try next." />
            </label>
          </div>

          {/* Technical parameters — secondary */}
          <div className="border border-border bg-card p-6">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Technical</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="text-xs font-medium">Concentration %
                <input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
              <label className="text-xs font-medium">Batch size ml
                <input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
            </div>
            <IfraCategoryPicker value={ifraCategory} onChange={setIfraCategory} testId="select-formula-ifra-category" />
          </div>

          {/* AI idea generator — optional/contextual, revealed on demand */}
          <details className="group border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground hover:text-foreground transition-colors select-none">
              <span className="flex items-center gap-2"><Sparkles size={11} />Generate from a brief</span>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 group-open:hidden">Explore</span>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60 hidden group-open:block">Close</span>
            </summary>
            <div className="border-t border-border">
              <FormulaIdeaGenerator onSelect={(n, b, mats) => {
                setName(n);
                setBrief(b);
                const rawIngs: FormulaIngredientInput[] = mats.map(mat => ({
                  materialId: 0,
                  materialName: mat.name,
                  percentage: mat.pct * (concentration / 100),
                  grams: parseFloat(((mat.pct / 100) * totalMl * (concentration / 100)).toFixed(3)),
                  dilution: 100,
                  role: mat.role,
                }));
                blueprintMatchedRef.current = true;
                setIngredients(matchBlueprintToLibrary(rawIngs, libraryMaterials));
              }} />
            </div>
          </details>
        </div>
        <div className="space-y-5">
          <IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} totalMl={totalMl} concentration={concentration} />
          <div className="flex items-center justify-between border border-border bg-card p-5">
            <div>
              <p className="font-display text-xl">Ready to save.</p>
              <p className="mt-1 text-xs text-muted-foreground">Every field can be revised after saving.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button href="/formulas" variant="quiet" testId="button-cancel-new">Cancel</Button>
              <Button type="submit" disabled={create.isPending || !name} testId="button-save-formula">{create.isPending ? "Saving..." : "Save draft"}</Button>
            </div>
          </div>
          {create.isError && <p className="text-sm text-destructive" data-testid="status-create-error">Couldn't save this formula. Try again.</p>}
        </div>
      </form>
    </Shell>
  );
}

function FormulaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const rawSearch = useSearch();
  const searchParams = new URLSearchParams(rawSearch);
  const stageParam = searchParams.get("stage") as WorkflowStageId | null;
  const requestedStage: WorkflowStageId | null = stageParam && WORKFLOW_STAGES.some(stage => stage.id === stageParam) ? stageParam : null;

  const query = useGetFormula(id, { query: { enabled: Number.isFinite(id), queryKey: getGetFormulaQueryKey(id) } });
  const update = useUpdateFormula();
  const remove = useDeleteFormula();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const formula = query.data;

  const materialsQuery = useListMaterials();
  const materials = materialsQuery.data ?? [];

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "resting" | "approved" | "archived">("draft");
  const [editConcentration, setEditConcentration] = useState(20);
  const [editTotalMl, setEditTotalMl] = useState(30);
  const [editIfraCategory, setEditIfraCategory] = useState("");
  const [editIngredients, setEditIngredients] = useState<FormulaIngredientInput[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const begin = () => {
    if (!formula) return;
    setSaveError(null);
    setName(formula.name);
    setBrief(formula.brief);
    setNotes(formula.notes ?? "");
    setStatus(formula.status);
    setEditConcentration(formula.concentration);
    setEditTotalMl(formula.totalMl);
    setEditIfraCategory(formula.ifraCategory ?? "");
    setEditIngredients(formula.ingredients.map(i => ({
      materialId: i.materialId,
      materialName: i.materialName,
      percentage: i.percentage,
      grams: i.grams,
      dilution: i.dilution ?? 100,
      role: i.role as FormulaIngredientInput["role"],
      allergenFlags: i.allergenFlags ?? [],
    })));
    setEditing(true);
  };

  const save = () => {
    if (!formula) return;
    setSaveError(null);
    update.mutate(
      { id, data: { expectedVersion: formula.version, name, brief, notes, status, concentration: editConcentration, totalMl: editTotalMl, ifraCategory: editIfraCategory || undefined, ingredients: editIngredients } },
      {
        onSuccess: result => {
          qc.setQueryData(getGetFormulaQueryKey(id), result);
          qc.invalidateQueries({ queryKey: getListFormulasQueryKey() });
          qc.invalidateQueries({ queryKey: getGetFormulaEventsQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setEditing(false);
        },
        onError: error => {
          const isConflict = (error as { status?: number }).status === 409;
          setSaveError(isConflict
            ? "This formula changed in another editor. Your work is still open here; close and reopen Edit to reconcile with the latest version."
            : "Couldn't save this revision. Your work is still open; try again.");
          if (isConflict) query.refetch();
        },
      },
    );
  };

  const destroy = () => {
    if (window.confirm("Delete this formula from the library?"))
      remove.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setLocation("/formulas"); } });
  };

  const eventsQuery = useGetFormulaEvents(id, { query: { queryKey: getGetFormulaEventsQueryKey(id), enabled: Number.isFinite(id) } });
  const events = eventsQuery.data ?? [];

  // Determine which stages are "done" based on formula data
  const completedStages = useMemo(
    () => getCompletedWorkflowStages(formula, materials),
    [formula, materials],
  );
  const activeStage = requestedStage ?? getSuggestedWorkflowStage(formula, materials);

  // Stage navigation helper — updates URL query string
  const navigateToStage = useCallback((stage: WorkflowStageId) => {
    setLocation(`/formulas/${id}?stage=${stage}`);
  }, [id, setLocation]);

  // Next stage in the workflow
  const currentIdx = WORKFLOW_STAGES.findIndex(s => s.id === activeStage);
  const nextStage = WORKFLOW_STAGES[currentIdx + 1];
  const prevStage = WORKFLOW_STAGES[currentIdx - 1];

  if (query.isLoading) return <Shell><div className="space-y-4 pt-8"><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-72 w-full" /></div></Shell>;
  if (query.isError || !formula) return <Shell><ErrorState retry={() => query.refetch()} /></Shell>;

  return (
    <Shell>
      {/* ── Header ───────────────────────────────────────────── */}
      <PageHeader
        eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · v${formula.version}`}
        title={formula.name}
        description={formula.brief}
        action={
          <div className="flex flex-wrap gap-2">
            <FormulaToolFileUpload testId="button-formula-upload-file" />
            <Button onClick={begin} variant="outline" testId="button-edit-formula">Edit</Button>
            <Button onClick={destroy} variant="quiet" testId="button-delete-formula">Delete</Button>
          </div>
        }
      />

      {/* ── Workflow navigation ───────────────────────────────── */}
      <WorkflowNav
        activeStage={activeStage}
        formulaId={id}
        completedStages={completedStages}
      />

      {/* ── Status strip ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
        <div className="flex items-center gap-3">
          <StatusPill value={formula.status} />
          <StatusPill value={formula.safetyStatus} />
          <StatusPill value={formula.ifraStatus} />
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono-ui text-[10px] text-muted-foreground">{formula.concentration}% · {formula.totalMl} ml · {formula.ingredients.length} materials</span>
        </div>
      </div>

      {/* ── Main content: stage panel + sidebar ──────────────── */}
      <div className="grid gap-6 py-6 lg:grid-cols-[1.35fr_.65fr]">
        {/* Stage panel */}
        <div>
          {/* Stage header */}
          <div className="mb-4">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">
              {WORKFLOW_STAGES.find(s => s.id === activeStage)?.label}
            </p>
            <h2 className="mt-0.5 font-display text-2xl">{WORKFLOW_STAGES[currentIdx]?.description}</h2>
          </div>

          {/* Stage content */}
          <AnimatePresence mode="wait">
            <WorkflowStagePanel
              key={activeStage}
              stage={activeStage}
              formula={formula}
              materials={materials}
              events={events}
              onEdit={begin}
            />
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Quick actions */}
          <div className="border border-border bg-card p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-4">Actions</p>
            <div className="space-y-2">
              <Button onClick={begin} variant="outline" testId="button-formula-edit-sidebar">Edit formula</Button>
            </div>
          </div>

          {/* Stage jump */}
          <div className="border border-border bg-secondary/30 p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Jump to stage</p>
            <div className="space-y-1">
              {WORKFLOW_STAGES.map(stage => {
                const Icon = stage.icon;
                const isActive = stage.id === activeStage;
                const isDone = completedStages.has(stage.id);
                return (
                  <button
                    key={stage.id}
                    onClick={() => navigateToStage(stage.id)}
                    data-testid={`button-jump-${stage.id}`}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-secondary/70 ${isActive ? "bg-secondary/80" : ""}`}
                  >
                    <Icon size={11} strokeWidth={1.8} className={isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"} />
                    <span className={`font-mono-ui text-[9px] uppercase tracking-[.1em] ${isActive ? "text-foreground font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{stage.label}</span>
                    {isDone && !isActive && <div className="ml-auto h-[3px] w-[3px] bg-accent/80" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="border border-border bg-card p-5">
            <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Details</p>
            <div className="space-y-2 text-xs">
              {formula.ifraCategory && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Category</span>
                  <span className="text-right">{IFRA_CATEGORIES.find(c => c.value === formula.ifraCategory)?.label ?? `Cat ${formula.ifraCategory}`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allergen notes</span>
                <span data-testid="text-formula-allergens">{formula.allergenCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span>{new Date(formula.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{formula.version}</span>
              </div>
            </div>
          </div>

          {/* Notes preview */}
          {formula.notes && (
            <div className="border border-border bg-card p-5">
              <p className="font-mono-ui text-[8px] uppercase tracking-[.16em] text-muted-foreground mb-3">Notes</p>
              <p className="line-clamp-4 text-xs leading-5 text-muted-foreground" data-testid="text-formula-notes">{formula.notes}</p>
              {formula.notes.length > 200 && (
                <button onClick={() => navigateToStage("document")} className="mt-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Read all →</button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Edit dialog (full-screen overlay) ────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
          <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Editing · formula {String(formula.id).padStart(3, "0")}</p>
                <h2 className="mt-1 font-display text-4xl">Stay curious.</h2>
              </div>
              <button onClick={() => setEditing(false)} data-testid="button-close-edit" className="grid size-9 place-items-center border border-border bg-card hover:bg-secondary">
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
              <div className="space-y-5">
                <div className="border border-border bg-card p-6 sm:p-7">
                  <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p>
                  <label className="mt-5 block text-xs font-medium">Name
                    <input value={name} onChange={e => setName(e.target.value)} data-testid="input-edit-name" className="mt-2 w-full border-b border-border bg-transparent py-2 font-display text-2xl outline-none focus:border-foreground" />
                  </label>
                  <label className="mt-5 block text-xs font-medium">Brief
                    <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-edit-brief" className="mt-2 min-h-20 w-full resize-none border border-border bg-secondary/45 p-3 text-sm leading-6 outline-none focus:border-foreground/40" />
                  </label>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <label className="text-xs font-medium">Concentration %
                      <input type="number" min="0" max="100" value={editConcentration} onChange={e => setEditConcentration(Number(e.target.value))} data-testid="input-edit-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                    </label>
                    <label className="text-xs font-medium">Batch size ml
                      <input type="number" min="0" value={editTotalMl} onChange={e => setEditTotalMl(Number(e.target.value))} data-testid="input-edit-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                    </label>
                  </div>
                  <label className="mt-5 block text-xs font-medium">Stage
                    <select value={status} onChange={e => setStatus(e.target.value as typeof status)} data-testid="select-edit-status" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40">
                      <option value="draft">Draft</option>
                      <option value="resting">Resting</option>
                      <option value="approved">Approved</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <IfraCategoryPicker value={editIfraCategory} onChange={setEditIfraCategory} testId="select-edit-ifra-category" />
                  <label className="mt-7 block text-xs font-medium">Notebook notes
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-edit-notes" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, things to remember..." />
                  </label>
                </div>
              </div>
              <div className="space-y-5">
                <IngredientBuilder ingredients={editIngredients} setIngredients={setEditIngredients} totalMl={editTotalMl} concentration={editConcentration} />
                <div className="flex items-center justify-between border border-border bg-card p-5">
                  <div>
                    <p className="font-display text-2xl">Save the revision.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Each save advances the version and records a revision summary.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setEditing(false)} variant="quiet" testId="button-cancel-edit">Cancel</Button>
                    <Button onClick={save} disabled={update.isPending || !name} testId="button-update-formula">{update.isPending ? "Saving…" : "Save changes"}</Button>
                  </div>
                </div>
                {saveError && <p className="text-sm text-destructive" data-testid="status-update-error">{saveError}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ── Streaming hook for Lab responses ─────────────────────────────────────────
type StreamMessage = {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
};

function useStreamMessage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const { getToken } = useAuth();
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (
    conversationId: number,
    data: { message: string; formulaContext?: string | null },
    callbacks: {
      onUserMessage?: (msg: StreamMessage) => void;
      onDone?: (msg: StreamMessage) => void;
      onError?: (err: string) => void;
    } = {},
  ) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsPending(true);
    setError(null);
    setStreamingContent("");

    try {
      const token = await getToken();
      const response = await fetch(`/api/conversations/${conversationId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: ac.signal,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          // Parse JSON in an isolated try so malformed lines are silently skipped,
          // but valid events (including type:"error") are dispatched outside it so
          // they can propagate to the outer catch and trigger onError / rollback.
          let evt: { type: string; message?: StreamMessage; token?: string; error?: string } | null = null;
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            // ignore malformed lines
            continue;
          }
          if (!evt) continue;
          if (evt.type === "user_message") {
            callbacks.onUserMessage?.(evt.message as StreamMessage);
          } else if (evt.type === "token") {
            setStreamingContent(prev => (prev ?? "") + (evt!.token as string));
          } else if (evt.type === "done") {
            callbacks.onDone?.(evt.message as StreamMessage);
          } else if (evt.type === "error") {
            throw new Error((evt.error as string) ?? "Server error");
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = (err instanceof Error ? err.message : null) ?? "Something went wrong";
      callbacks.onError?.(msg);
      setError(msg);
    } finally {
      setIsPending(false);
      setStreamingContent(null);
    }
  }, [getToken]);

  return { send, isPending, error, streamingContent };
}

function Coach() {
  const search = useSearch();
  const rawFormulaId = new URLSearchParams(search).get("formula");
  const formulaId = rawFormulaId ? Number(rawFormulaId) : null;
  const formulaQuery = useGetFormula(formulaId ?? 0, {
    query: { enabled: !!formulaId && Number.isFinite(formulaId), queryKey: getGetFormulaQueryKey(formulaId ?? 0) },
  });
  const activeFormula = formulaQuery.data ?? null;

  const rawConvId = new URLSearchParams(search).get("conv");
  const convFromUrl = rawConvId && Number.isFinite(Number(rawConvId)) ? Number(rawConvId) : null;
  const autoSendParam = new URLSearchParams(search).get("autoSend");
  const attachIntent = new URLSearchParams(search).get("attach") === "1";

  const buildContext = useCallback((f: typeof activeFormula): string | null => {
    if (!f) return null;
    return [
      `Formula: ${f.name}`,
      f.brief ? `Brief: ${f.brief}` : null,
      `Concentration: ${f.concentration}% EDP · ${f.totalMl}ml batch`,
      f.ingredients.length
        ? `Ingredients: ${f.ingredients.map(i => `${i.materialName} ${i.percentage}% (${i.role})`).join(", ")}`
        : null,
      f.notes ? `Notes: ${f.notes}` : null,
    ].filter(Boolean).join("\n");
  }, []);

  const qc = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(convFromUrl);
  const [newTitle, setNewTitle] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [message, setMessage] = useState("");
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const attachStartedRef = useRef(false);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<FormulaFileAnalysis | null>(null);
  const [attachedFile, setAttachedFile] = useState<StudioFile | null>(null);
  const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("matiere-pinned-sessions") ?? "[]")); }
    catch { return new Set(); }
  });
  const togglePin = (id: number) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("matiere-pinned-sessions", JSON.stringify([...next]));
      return next;
    });
  };

  const convsQuery = useListConversations();
  const convQuery = useGetConversation(selectedConvId ?? 0, {
    query: { enabled: !!selectedConvId, queryKey: getGetConversationQueryKey(selectedConvId ?? 0) },
  });
  const createConv = useCreateConversation();
  const streamMsg = useStreamMessage();
  const deleteConv = useDeleteConversation();

  const conversations = convsQuery.data ?? [];
  const activeConv = convQuery.data;

  // Auto-send a seed message when an accord/mood creates a new session
  const [pendingAutoMessage, setPendingAutoMessage] = useState<string | null>(null);
  const pendingSentRef = useRef(false);
  useEffect(() => {
    if (pendingSentRef.current) return;
    if (!pendingAutoMessage || !selectedConvId || !activeConv) return;
    if (activeConv.messages.length > 0) { setPendingAutoMessage(null); return; }
    pendingSentRef.current = true;
    const msg = pendingAutoMessage;
    setPendingAutoMessage(null);
    const convId = selectedConvId;
    const optimisticId = -Date.now();
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
      old ? { ...old, messages: [...old.messages, { id: optimisticId, conversationId: convId, role: "user" as const, content: msg, createdAt: new Date().toISOString() }] } : old
    );
    streamMsg.send(convId, { message: msg, formulaContext: null }, {
      onUserMessage: (userMsg) => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) } : old
        );
      },
      onDone: (assistantMsg) => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: [...old.messages, assistantMsg] } : old
        );
        qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
      onError: () => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: old.messages.filter(m => m.id !== optimisticId) } : old
        );
      },
    });
  }, [pendingAutoMessage, selectedConvId, activeConv, streamMsg, qc]);

  // Auto-send the message from QuickPrompt once the conversation is ready
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSentRef.current) return;
    if (!autoSendParam || !selectedConvId || !activeConv) return;
    autoSentRef.current = true;
    const ctx = buildContext(activeFormula);
    const convId = selectedConvId;

    // Optimistic update: show the user bubble immediately
    const optimisticId = -Date.now();
    const optimisticMsg: StreamMessage = {
      id: optimisticId,
      conversationId: convId,
      role: "user",
      content: autoSendParam,
      createdAt: new Date().toISOString(),
    };
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
      if (!old) return old;
      return { ...old, messages: [...old.messages, optimisticMsg] };
    });

    let serverConfirmed = false;

    streamMsg.send(
      convId,
      { message: autoSendParam, formulaContext: ctx },
      {
        onUserMessage: (userMsg) => {
          serverConfirmed = true;
          // Swap the optimistic bubble for the server-confirmed message
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) };
          });
        },
        onDone: (assistantMsg) => {
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: [...old.messages, assistantMsg] };
          });
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          if (serverConfirmed) return; // message persisted — leave the bubble as-is
          // Roll back the optimistic bubble (pure network/HTTP failure)
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.filter(m => m.id !== optimisticId) };
          });
        },
      },
    );
  }, [autoSendParam, selectedConvId, activeConv, activeFormula, streamMsg, qc, buildContext]);

  // Scroll messages to bottom on update
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length, streamMsg.streamingContent, streamMsg.isPending]);

  const createWithTitle = (title: string, autoMessage?: string) => {
    pendingSentRef.current = false; // reset so the effect can fire for this new session
    createConv.mutate(
      { data: { title } },
      {
        onSuccess: (conv) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conv.id);
          setCreatingNew(false);
          setNewTitle("");
          if (autoMessage) setPendingAutoMessage(autoMessage);
        },
      },
    );
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createWithTitle(newTitle.trim() || "New session");
  };

  useEffect(() => {
    if (!attachIntent || attachStartedRef.current || selectedConvId || createConv.isPending) return;
    attachStartedRef.current = true;
    createConv.mutate(
      { data: { title: "Formula file analysis" } },
      {
        onSuccess: (conversation) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conversation.id);
          setCreatingNew(false);
        },
        onError: () => {
          attachStartedRef.current = false;
          setFileAnalysisError("Couldn't create an analysis session. Please try again.");
        },
      },
    );
  }, [attachIntent, selectedConvId, createConv, qc]);

  const analyzeFile = async (file: File) => {
    if (!file.size || file.size > MAX_UPLOAD_BYTES) {
      setFileAnalysisError("Choose a file between 1 byte and 25 MB.");
      return;
    }
    setIsAnalyzingFile(true);
    setFileAnalysisError(null);
    setFileAnalysis(null);
    try {
      const request = await fetch(`${basePath}/api/uploads/request-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
      });
      const requested = await request.json().catch(() => ({})) as { uploadUrl?: string; objectKey?: string; category?: StudioFile["category"]; error?: string };
      if (!request.ok || !requested.uploadUrl || !requested.objectKey || !requested.category) throw new Error(requested.error ?? "Couldn't prepare this formula file.");
      const stored = await fetch(requested.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!stored.ok) throw new Error("The formula file could not be saved.");
      const completed = await fetch(`${basePath}/api/uploads`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          objectKey: requested.objectKey,
          category: requested.category,
        }),
      });
      const saved = await completed.json().catch(() => ({})) as StudioFile & { error?: string };
      if (!completed.ok || !saved.id) throw new Error(saved.error ?? "The upload finished but could not be filed.");
      setAttachedFile(saved);
      if (!canAnalyzeFormulaFile(saved)) {
        setMessage(`I attached “${saved.name}”. It is saved in the File Drawer. Tell me what you want to explore from this reference.`);
        qc.invalidateQueries({ queryKey: ["studio-files"] });
        return;
      }
      const analysisResponse = await fetch(`${basePath}/api/uploads/${saved.id}/analyze`, {
        method: "POST",
        credentials: "include",
      });
      const analysis = await analysisResponse.json().catch(() => ({})) as FormulaFileAnalysis & { error?: string };
      if (!analysisResponse.ok) throw new Error(analysis.error ?? "I couldn't read that formula.");
      setFileAnalysis(analysis);
      setMessage(`I uploaded “${analysis.sourceFile}”. Review the formula analysis below and help me decide what to adjust next.`);
      qc.invalidateQueries({ queryKey: ["studio-files"] });
    } catch (error) {
      setFileAnalysisError(error instanceof Error ? error.message : "I couldn't analyze that file.");
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const beginHubAttachment = (file: File) => {
    if (selectedConvId) {
      void analyzeFile(file);
      return;
    }
    setFileAnalysisError(null);
    createConv.mutate(
      { data: { title: "File analysis" } },
      {
        onSuccess: conversation => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conversation.id);
          setCreatingNew(false);
          void analyzeFile(file);
        },
        onError: () => setFileAnalysisError("Couldn't create a session for this file. Please try again."),
      },
    );
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    // Require activeConv to be loaded so the optimistic cache write always has a target
    if (!message.trim() || !selectedConvId || !activeConv) return;
    const ctx = buildContext(activeFormula);
    const sentMessage = message;
    setMessage("");
    const convId = selectedConvId;

    // Optimistic update: show the user bubble immediately, before the server confirms
    const optimisticId = -Date.now();
    const optimisticMsg: StreamMessage = {
      id: optimisticId,
      conversationId: convId,
      role: "user",
      content: sentMessage,
      createdAt: new Date().toISOString(),
    };
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
      if (!old) return old;
      return { ...old, messages: [...old.messages, optimisticMsg] };
    });

    // Track whether the server has persisted and confirmed the user message.
    // If it has, a later generation failure must NOT roll back the bubble (the
    // message is in the DB) and must NOT restore the input (retrying would duplicate it).
    let serverConfirmed = false;

    streamMsg.send(
      convId,
      { message: sentMessage, formulaContext: ctx },
      {
        onUserMessage: (userMsg) => {
          serverConfirmed = true;
          // Swap the optimistic bubble for the server-confirmed message
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) };
          });
        },
        onDone: (assistantMsg) => {
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: [...old.messages, assistantMsg] };
          });
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          if (serverConfirmed) {
            // The user message is already persisted on the server — leave the bubble
            // and do not restore the input (retrying would create a duplicate).
            return;
          }
          // Pure network / HTTP failure before the server saved anything — roll back
          // the optimistic bubble and let the user try again.
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.filter(m => m.id !== optimisticId) };
          });
          setMessage(sentMessage);
        },
      },
    );
  };

  const handleDelete = (convId: number) => {
    if (!window.confirm("Delete this session?")) return;
    deleteConv.mutate(
      { conversationId: convId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (selectedConvId === convId) setSelectedConvId(null);
        },
      },
    );
  };

  const relativeDate = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter(c =>
    !sessionSearch.trim() || c.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  // ── Personalized moods & accords from the user's material library ──
  const materialsQuery = useListMaterials();
  const libraryMaterials = materialsQuery.data ?? [];

  const { moods, accords } = useMemo(() => {
    // Group the library by canonical olfactive family aliases. A material can
    // belong to more than one family when its value is composite.
    const byFamily = new Map<string, Material[]>();
    for (const m of libraryMaterials) {
      for (const key of normalizeMaterialFamilies(m.family)) {
        const list = byFamily.get(key) ?? [];
        list.push(m);
        byFamily.set(key, list);
      }
    }
    const has = (fams: readonly string[]) => fams.some(f => (byFamily.get(f)?.length ?? 0) > 0);
    const owned = (fams: readonly string[]) =>
      fams.flatMap(f => byFamily.get(f) ?? []).map(m => m.name);

    const moodList = BASE_MOODS.map(mood => {
      const names = owned(mood.families);
      const prompt = names.length > 0
        ? `${mood.prompt}. From my own material library I have: ${names.slice(0, 6).join(", ")} — build the direction around what I already own.`
        : mood.prompt;
      return { ...mood, prompt, ownedCount: names.length };
    });

    const accordList = BASE_ACCORDS.map(accord => {
      const names = owned(accord.families);
      const buildable = accord.families.length > 0 && accord.families.every(f => has([f]));
      const missingFamilies = accord.families.filter(f => !has([f]));
      const familyLabel = accord.families[0] ?? "";
      const hint = names.length > 0
        ? (names.length === 1
            ? `You have ${names[0]} — a starting point.`
            : `You have ${names.length} ${familyLabel} materials to build with.`)
        : null;
      return { ...accord, ownedNames: names, buildable, missingFamilies, hint };
    });

    // Buildable accords first, so suggestions lead with what the studio actually owns
    accordList.sort((a, b) => Number(b.buildable) - Number(a.buildable));

    return { moods: moodList, accords: accordList };
  }, [libraryMaterials]);

  // ── View: hub vs chat ──
  const inChat = !!selectedConvId;

  return (
    <Shell>
      {/* ════════════════════════════════════════
          HUB VIEW  (no session selected)
      ════════════════════════════════════════ */}
      {!inChat && (
        <div className="-mx-5 sm:-mx-8 lg:-mx-12 overflow-y-auto" style={{ height: "calc(100dvh - 3.5rem)" }}>
          <div className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-8">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">Creative lab</p>
                <h1 className="mt-2 font-display text-5xl leading-[1.0] tracking-tight sm:text-6xl">
                  What are you<br />working on?
                </h1>
              </div>
              <div className="mt-1 flex shrink-0 items-center gap-2">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  className="sr-only"
                  data-testid="input-coach-formula-upload"
                  onChange={event => {
                    const [file] = Array.from(event.target.files ?? []);
                    if (file) beginHubAttachment(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isAnalyzingFile || createConv.isPending}
                  data-testid="button-attach-formula-file"
                  aria-label="Upload a studio file"
                  className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  {isAnalyzingFile ? <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" /> : <Paperclip size={15} />}
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCreatingNew(v => !v)}
                  data-testid="button-new-session"
                  className="bg-foreground px-5 py-2.5 font-mono-ui text-[9px] uppercase tracking-widest text-background transition-opacity hover:opacity-75"
                >
                  + New
                </motion.button>
              </div>
            </div>

            {/* ── New-session inline form ── */}
            <AnimatePresence>
              {creatingNew && (
                <motion.form
                  key="new-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleCreate}
                  className="overflow-hidden"
                >
                  <div className="mt-5 border border-border bg-secondary/15 px-5 py-4">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Name this thread…"
                      data-testid="input-session-title"
                      className="w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/40"
                    />
                    <div className="mt-3 flex gap-2">
                      <Button type="submit" disabled={createConv.isPending} testId="button-create-conv">
                        {createConv.isPending ? "Creating…" : "Create"}
                      </Button>
                      <Button onClick={() => { setCreatingNew(false); setNewTitle(""); }} variant="quiet" testId="button-cancel-create">Cancel</Button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* ── Explore by mood ── */}
            <div className="mt-10">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Explore by mood</p>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
                {moods.map((mood, i) => (
                  <motion.button
                    key={mood.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => createWithTitle(mood.name, `Give me a creative brief for a ${mood.name.toLowerCase()} fragrance direction — ${mood.prompt}. Describe the feeling, the key materials that define it, and two or three specific accord ideas I could explore.`)}
                    disabled={createConv.isPending}
                    className="group flex shrink-0 flex-col items-center gap-2.5 disabled:opacity-50"
                  >
                    <div className="relative size-[72px] overflow-hidden rounded-full ring-1 ring-border transition-all duration-200 group-hover:ring-2 group-hover:ring-foreground/30">
                      <img src={mood.img} alt={mood.name} className="size-full object-cover" />
                      <div className="absolute inset-0 rounded-full bg-foreground/0 transition-colors duration-200 group-hover:bg-foreground/5" />
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{mood.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Popular accords ── */}
            <div className="mt-10">
              <p className="mb-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Popular accords</p>
              <div className="space-y-2">
                {accords.map((accord, i) => {
                  const Icon = accord.icon;
                  return (
                    <motion.div
                      key={accord.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="group flex w-full items-center gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3.5 transition-colors hover:bg-secondary/40">
                        <button
                          type="button"
                          onClick={() => createWithTitle(accord.name, accord.ownedNames.length > 0
                            ? `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), and how I could build it starting from materials I already own: ${accord.ownedNames.slice(0, 6).join(", ")}. What would I still need to add?`
                            : `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), which raw materials are essential to building it, and what's a modern take I could explore?`)}
                          disabled={createConv.isPending}
                          className="flex min-w-0 flex-1 items-center gap-4 text-left disabled:opacity-50"
                        >
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-background">
                            <Icon size={14} strokeWidth={1.5} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-medium">{accord.name}</p>
                              {accord.buildable && (
                                <span
                                  className="inline-flex shrink-0 items-center border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest text-accent-foreground/70"
                                  data-testid={`badge-buildable-${accord.name.toLowerCase().replaceAll(" ", "-")}`}
                                >
                                  You have the materials
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{accord.hint ?? accord.desc}</p>
                          </div>
                          <ArrowRight size={13} className="shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                        </button>
                        {accord.missingFamilies.length === 1 && (
                          <Link
                            href={`/materials?search=${encodeURIComponent(accord.missingFamilies[0])}`}
                            data-testid={`link-missing-family-${accord.name.toLowerCase().replaceAll(" ", "-")}`}
                            className="shrink-0 border-l border-border pl-4 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Missing: {accord.missingFamilies[0]}
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Recent inspiration (sessions) ── */}
            {conversations.length > 0 && (
              <div className="mt-10">
                <p className="mb-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Recent inspiration</p>
                {convsQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-[72px] w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-px border-t border-border">
                    {[...conversations.filter(c => pinnedIds.has(c.id)), ...conversations.filter(c => !pinnedIds.has(c.id))].slice(0, 8).map((conv, i) => {
                      const isPinned = pinnedIds.has(conv.id);
                      return (
                        <motion.button
                          key={conv.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedConvId(conv.id)}
                          data-testid={`button-session-${conv.id}`}
                          className="group flex w-full items-start justify-between gap-4 border-b border-border py-5 text-left transition-colors hover:bg-secondary/10"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isPinned && <span className="font-mono-ui text-[7px] uppercase tracking-widest text-accent-foreground/60">Pinned</span>}
                              <p className="text-base font-medium leading-snug group-hover:text-foreground">{conv.title}</p>
                            </div>
                            <p className="mt-1.5 font-mono-ui text-[8px] text-muted-foreground/50">
                              {conv.messageCount ?? 0} {(conv.messageCount ?? 0) === 1 ? "msg" : "msgs"} · {relativeDate(conv.updatedAt)}
                            </p>
                          </div>
                          <div className="mt-0.5 flex shrink-0 items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); togglePin(conv.id); }}
                              aria-label={isPinned ? "Unpin session" : "Pin session"}
                              className={`transition-opacity ${isPinned ? "opacity-100 text-foreground" : "opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground"}`}
                            >
                              <Bookmark size={12} className={isPinned ? "fill-foreground" : ""} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(conv.id); }}
                              aria-label="Delete session"
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive"
                            >
                              <X size={11} />
                            </button>
                            <ArrowRight size={13} className="text-muted-foreground/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty state — no sessions yet */}
            {conversations.length === 0 && !convsQuery.isLoading && (
              <div className="mt-12 border border-dashed border-border px-6 py-10 text-center">
                <p className="font-display text-2xl">No threads yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Tap a mood, an accord, or «+ New» to start your first session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CHAT VIEW  (session selected)
      ════════════════════════════════════════ */}
      {inChat && (
        <div className="-mx-5 sm:-mx-8 lg:-mx-12 flex flex-col overflow-hidden" style={{ height: "calc(100dvh - 3.5rem)" }}>

          {/* Top bar */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3 sm:px-8">
            <button
              onClick={() => setSelectedConvId(null)}
              className="grid size-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to lab"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="min-w-0 flex-1">
              {activeConv ? (
                <p className="truncate text-sm font-medium">{activeConv.title}</p>
              ) : (
                <Skeleton className="h-4 w-48" />
              )}
            </div>
            {activeFormula && (
              <Link
                href={`/formulas/${activeFormula.id}`}
                data-testid="link-active-formula"
                className="flex shrink-0 items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                <FlaskConical size={9} />
                {activeFormula.name} ↗
              </Link>
            )}
            <button
              onClick={() => handleDelete(selectedConvId!)}
              aria-label="Delete session"
              className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
            >
              <X size={13} />
            </button>
          </div>

          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl space-y-7 px-5 py-8 sm:px-8">
              {convQuery.isLoading && <Skeleton className="h-24 w-full" />}

              {activeConv?.messages.length === 0 && !convQuery.isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="py-16 text-center"
                >
                  <p className="font-display text-4xl">What are you working on?</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {activeFormula
                      ? `The lab knows about ${activeFormula.name}. Ask about its structure, a material, or what to try next.`
                      : "A difficult material, a flat drydown, a brief that won't settle. Bring the unfinished thought."}
                  </p>
                </motion.div>
              )}

              {activeConv?.messages.map(msg => (
                <div key={msg.id} className={msg.role === "user" ? "pl-8 sm:pl-16" : "pr-2"}>
                  <p className="mb-2 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50">
                    {msg.role === "user" ? "You" : "Lab"} · {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className={msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm border border-border bg-secondary/30 px-4 py-3 text-sm leading-6"
                    : "border-l-2 border-accent pl-5 text-sm leading-7"
                  }>
                    {msg.role === "user" ? msg.content : <MarkdownMessage content={msg.content} />}
                  </div>
                </div>
              ))}

              {streamMsg.isPending && (
                <div className="pr-2">
                  <p className="mb-2 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50">Lab · now</p>
                  <div className="border-l-2 border-accent pl-5 text-sm leading-7">
                    {streamMsg.streamingContent
                      ? <MarkdownMessage content={streamMsg.streamingContent} />
                      : (
                        <div className="flex gap-1.5 py-2">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="size-1.5 animate-pulse rounded-full bg-accent/60" style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
              {attachedFile && !fileAnalysis && (
                <div className="border border-border bg-secondary/15 p-5" data-testid="panel-file-attachment">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center border border-border bg-background text-muted-foreground"><FileCategoryIcon category={attachedFile.category} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">File attached</p>
                      <p className="truncate text-sm font-medium">{attachedFile.name}</p>
                    </div>
                    <Link href="/files" className="shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Open drawer ↗</Link>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">This reference is filed and ready to discuss. JSON and CSV formula exports also receive ingredient, allergen, and IFRA analysis here.</p>
                </div>
              )}
              {fileAnalysis && (
                <div className="border border-border bg-secondary/15 p-5" data-testid="panel-formula-file-analysis">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">Formula file read</p>
                      <h2 className="mt-1 font-display text-3xl">{fileAnalysis.formulaName}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{fileAnalysis.ingredientCount} ingredients · {fileAnalysis.sourceFile}</p>
                    </div>
                    <button onClick={() => setFileAnalysis(null)} aria-label="Dismiss analysis" className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-6">{fileAnalysis.interpretation}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Known allergens</p>
                      <p className="mt-2 text-sm">{fileAnalysis.allergens.length ? fileAnalysis.allergens.join(", ") : "None found in matched materials."}</p>
                    </div>
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Unmatched materials</p>
                      <p className="mt-2 text-sm">{fileAnalysis.unknownMaterials.length ? fileAnalysis.unknownMaterials.join(", ") : "All ingredients matched."}</p>
                    </div>
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">IFRA review</p>
                      <p className="mt-2 text-sm">{fileAnalysis.ifraWarnings.length ? `${fileAnalysis.ifraWarnings.length} item${fileAnalysis.ifraWarnings.length === 1 ? "" : "s"} need review.` : "No library-limit flags."}</p>
                    </div>
                  </div>
                  {fileAnalysis.ifraWarnings.length > 0 && <ul className="mt-4 space-y-1 border-l-2 border-destructive/60 pl-3 text-xs leading-5 text-muted-foreground">{fileAnalysis.ifraWarnings.map(item => <li key={item.material}><strong className="text-foreground">{item.material}:</strong> {item.warning}</li>)}</ul>}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">A ready-to-send question has been added to the prompt below so you can continue with the AI coach.</p>
                    {attachedFile && <Link href={`/files?analyze=${attachedFile.id}`} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="link-save-coach-analysis">
                      Review &amp; save as draft ↗
                    </Link>}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Pinned input */}
          <div className="shrink-0 border-t border-border px-5 py-4 sm:px-8">
            <input
              ref={attachmentInputRef}
              type="file"
              accept={FILE_ACCEPT}
              className="sr-only"
              data-testid="input-coach-formula-upload"
              onChange={event => {
                const [file] = Array.from(event.target.files ?? []);
                if (file) void analyzeFile(file);
                event.target.value = "";
              }}
            />
            <form onSubmit={handleSend} className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-border bg-secondary/20 px-5 py-2.5">
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={isAnalyzingFile || streamMsg.isPending || !activeConv}
                data-testid="button-attach-formula-file"
                aria-label="Upload formula file for analysis"
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
              >
                {isAnalyzingFile ? <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" /> : <Paperclip size={15} />}
              </button>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={streamMsg.isPending || !activeConv}
                data-testid="input-coach-message"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder={activeFormula ? `Ask about ${activeFormula.name}…` : "I'm working on…"}
              />
              <button
                type="submit"
                disabled={streamMsg.isPending || !message.trim() || !activeConv}
                data-testid="button-send-coach"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-30"
              >
                {streamMsg.isPending
                  ? <span className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  : <Send size={13} />}
              </button>
            </form>
            {streamMsg.error && (
              <p className="mt-2 text-center text-xs text-destructive" data-testid="status-coach-error">{streamMsg.error}</p>
            )}
            {fileAnalysisError && <p className="mt-2 text-center text-xs text-destructive" data-testid="status-formula-file-error">{fileAnalysisError}</p>}
            {attachIntent && !fileAnalysis && !isAnalyzingFile && (
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="mx-auto mt-3 flex items-center gap-2 border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
                data-testid="button-start-formula-file-analysis"
              >
                <Paperclip size={13} /> Attach a formula file to start analysis
              </button>
            )}
            <p className="mx-auto mt-2 max-w-2xl text-center font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/60">Attach JSON or CSV formula exports for AI analysis, allergen matching, and IFRA review</p>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shop() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Materials · market"
        title="Shop & source."
        description="Acquire what the next formula needs. Your store, and a curated index of trusted suppliers."
      />
      <div className="grid gap-px border border-border bg-border lg:grid-cols-2">
        <div className="bg-card p-10">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.25em] text-muted-foreground">Your storefront</p>
          <p className="mt-6 font-display text-4xl leading-tight">Sell your materials.</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground max-w-xs">
            List essential oils and aroma chemicals. Shopify handles checkout, fulfilment, and inventory.
          </p>
          <div className="mt-8 border border-border p-5 text-center">
            <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Shopify connection coming soon</p>
          </div>
        </div>
        <div className="bg-card p-10">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.25em] text-muted-foreground">Sourcing index</p>
          <p className="mt-6 font-display text-4xl leading-tight">Source materials.</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground max-w-xs">
            A curated directory of trusted fragrance suppliers.
          </p>
          <div className="mt-8 space-y-px border border-border">
            {[
              { name: "Fraterworks", category: "Aroma chemicals · bases · specialties", url: "https://www.fraterworks.com" },
              { name: "PCW", category: "Essential oils · aroma chemicals · raw materials", url: "https://www.pcw.ca" },
              { name: "Contrebande", category: "Naturals · aroma chemicals · Canada", url: "https://contrebande.ca" },
            ].map(supplier => (
              <a key={supplier.name} href={supplier.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start justify-between gap-4 bg-card p-4 transition-colors hover:bg-secondary group">
                <div>
                  <p className="text-sm font-medium">{supplier.name}</p>
                  <p className="mt-0.5 font-mono-ui text-[9px] uppercase tracking-[.1em] text-muted-foreground">{supplier.category}</p>
                </div>
                <ArrowUpRight size={13} className="mt-1 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

const FIELD_NOTE_SCENES = [
  {
    fieldNote: "014", date: "03.14",
    bg: "hero-flowers.jpg",
    name: "salt / iris", nameEm: "old wood",
    description: "A little mineral. A soft refusal. Something that stays after the room is empty.",
    concentration: "20%", unit: "eau de parfum",
  },
  {
    fieldNote: "007", date: "11.02",
    bg: "rose.jpg",
    name: "rose / amber", nameEm: "musk",
    description: "Full-bodied without sweetness. A rose that smells like it was just cut.",
    concentration: "22%", unit: "eau de parfum",
  },
  {
    fieldNote: "021", date: "07.28",
    bg: "vetiver.jpg",
    name: "cedar / smoke", nameEm: "vetiver",
    description: "Rooted and unhurried. The kind of dry that feels earned.",
    concentration: "15%", unit: "eau de parfum",
  },
  {
    fieldNote: "033", date: "01.09",
    bg: "resin.jpg",
    name: "labdanum / oud", nameEm: "benzoin",
    description: "Resinous and warm. Something ancient without being obvious about it.",
    concentration: "18%", unit: "extrait de parfum",
  },
];

function FieldNoteCard() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-160, 160], [7, -7]), { damping: 22, stiffness: 180 });
  const rotateY = useSpring(useTransform(mouseX, [-160, 160], [-7, 7]), { damping: 22, stiffness: 180 });

  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % FIELD_NOTE_SCENES.length), 4400);
    return () => clearInterval(t);
  }, []);

  const base = import.meta.env.BASE_URL + "images/";

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); mouseX.set(e.clientX - r.left - r.width / 2); mouseY.set(e.clientY - r.top - r.height / 2); }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.22, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[420px] cursor-default lg:min-h-[540px]"
    >
      <div className="absolute inset-0 overflow-hidden border border-border text-foreground">

        {/* ── Crossfading scene layer (bg + text together) ── */}
        <AnimatePresence mode="sync">
          {FIELD_NOTE_SCENES.map((scene, i) => i !== active ? null : (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Background */}
              <img
                src={base + scene.bg}
                alt="Studio material photograph"
                className="absolute inset-0 h-full w-full object-cover"
                data-testid={i === 0 ? "img-hero-photo" : undefined}
              />
              {/* Field note header */}
              <div className="relative flex justify-between px-8 pt-8 font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">
                <span>Field note {scene.fieldNote}</span><span>{scene.date}</span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-10 left-8 right-8 z-[1]">
                <p className="font-display text-6xl leading-[.82] text-foreground">
                  {scene.name}<br /><em>{scene.nameEm}</em>
                </p>
                <div className="mt-7 flex items-end justify-between">
                  <p className="max-w-[180px] text-sm leading-6 text-muted-foreground">{scene.description}</p>
                  <div className="grid size-20 place-items-center border border-border font-mono-ui text-[9px] text-center uppercase leading-3">
                    {scene.concentration}<br />{scene.unit}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Dot indicators ── */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {FIELD_NOTE_SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Scene ${i + 1}`}
              className={`h-[3px] rounded-full transition-all duration-500 ${
                i === active ? "w-5 bg-foreground/50" : "w-[3px] bg-foreground/20 hover:bg-foreground/35"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MoodboardDemo data ───────────────────────────────────────────────────────

interface ScentDir {
  id: string;
  label: string;
  tagline: string;
  keywords: string[];
  rationale: string;
  materials: { name: string; reason: string }[];
}

const SCENT_DIRECTIONS: ScentDir[] = [
  {
    id: "soft-focus",
    label: "Soft focus",
    tagline: "Airy woods, gentle warmth, a close-to-skin feeling.",
    keywords: ["Transparent", "Skin-close", "Airy", "Soft woods"],
    rationale: "The fogged glass and warm skin in your moodboard suggest something close but blurred — familiar without being literal. This direction keeps warmth intimate and avoids anything sweet or heavy.",
    materials: [
      { name: "Ambroxan", reason: "Warm, mineral, and skin-like. Creates that close-to-skin transparency without sweetness." },
      { name: "Cashmeran", reason: "Soft woody warmth. Adds the fuzzy, enveloping quality that makes this direction intimate rather than distant." },
      { name: "Iso E Super", reason: "Transparent woody diffusion. Blurs the edges so the composition reads as presence, not perfume." },
    ],
  },
  {
    id: "after-dark",
    label: "After dark",
    tagline: "A floral direction with shadow, depth, and contrast.",
    keywords: ["Dark floral", "Contrast", "Shadow", "Depth"],
    rationale: "The dark lacquer in your moodboard pulls toward something with presence and contrast — a floral that is not cheerful, with shadow at its base. Warmth and strangeness in equal measure.",
    materials: [
      { name: "Rose Absolute", reason: "Not a fresh rose — this is honeyed and slightly animalic. The depth comes from its damascenone edge." },
      { name: "Labdanum Absolute", reason: "Warm, resinous, slightly leathery. The shadow underneath the floral." },
      { name: "Hedione", reason: "Diffusive and transparent. Lifts the darker elements so the composition breathes." },
    ],
  },
  {
    id: "warm-surface",
    label: "Warm surface",
    tagline: "Resinous warmth balanced with dry, textured elements.",
    keywords: ["Resinous", "Dry", "Textured", "Mineral"],
    rationale: "The warm skin and textured surfaces in your moodboard point toward something with physical presence — resinous but not sweet, warm but with a dry mineral edge that keeps it from becoming heavy.",
    materials: [
      { name: "Benzoin Resinoid", reason: "Warm, slightly vanilla-edged resin. Grounds the direction in something rich and textured." },
      { name: "Vetiver", reason: "Dry, earthy, slightly smoky. Counterbalances the resin and adds the textured quality your references suggest." },
      { name: "Cedarwood Atlas", reason: "Dry woody structure. Keeps the warmth from turning heavy or sweet." },
    ],
  },
];

interface Refinement {
  id: string;
  label: string;
  directionId: string;
  rationale: string;
  keywords: string[];
  materials: { name: string; reason: string }[];
}

const REFINEMENTS: Refinement[] = [
  // Soft focus refinements
  {
    id: "sf-less-floral",
    label: "Less floral",
    directionId: "soft-focus",
    keywords: ["Transparent", "Mineral", "Airy", "Clean skin"],
    rationale: "Pulled back from any floral suggestion — now purely skin and mineral. The warmth stays but becomes more abstract, closer to the smell of clean skin in cool air.",
    materials: [
      { name: "Ambroxan", reason: "Now at the centre, undiluted by floral support. Mineral and skin-close." },
      { name: "Iso E Super", reason: "The only woody element — transparent and spacious." },
      { name: "Habanolide", reason: "A clean, skin-close musk that replaces any softness from the original Cashmeran." },
    ],
  },
  {
    id: "sf-more-mineral",
    label: "More mineral",
    directionId: "soft-focus",
    keywords: ["Cold mineral", "Transparent", "Skin", "Geological"],
    rationale: "A cooler, more structural version — the warmth recedes and a cold mineral character comes forward. Think the smell of stone in morning air.",
    materials: [
      { name: "Ambroxan", reason: "Still the skin-anchor, but now surrounded by cooler elements." },
      { name: "Calone 1951", reason: "Used at sub-trace — not marine, but cold and open. The mineral quality without the aquatic." },
      { name: "Stemone", reason: "Structural green-mineral. Adds precision and coldness." },
    ],
  },
  {
    id: "sf-explore",
    label: "Explore another direction",
    directionId: "soft-focus",
    keywords: ["Powder", "Iris", "Intimate", "Quiet floral"],
    rationale: "A different reading of the same moodboard — quieter, more powdery. The iris direction reads the warm skin as something more human and personal.",
    materials: [
      { name: "Orris Concrete", reason: "Earthy, powdery iris. Reads as skin memory rather than flower." },
      { name: "Ethylene Brassylate", reason: "A large-ring musk with a clean, close-to-skin quality." },
      { name: "Irone Alpha", reason: "Cold, slightly woody iris facet at low dose. Intimate rather than floral." },
    ],
  },
  // After dark refinements
  {
    id: "ad-less-floral",
    label: "Less floral",
    directionId: "after-dark",
    keywords: ["Shadow", "Resinous", "Depth", "Animalic"],
    rationale: "The floral element recedes to a trace. The shadow and depth remain — now more resinous and animalic, the floral becomes a memory rather than a presence.",
    materials: [
      { name: "Labdanum Absolute", reason: "Moves to the foreground. Warm, leathery, complex." },
      { name: "Civet Synthetic", reason: "At trace level, adds the animalic quality without the flower." },
      { name: "Benzoin Resinoid", reason: "Sweetens the resinous base so it does not become austere." },
    ],
  },
  {
    id: "ad-more-mineral",
    label: "More mineral",
    directionId: "after-dark",
    keywords: ["Dark floral", "Mineral", "Cold contrast", "Structural"],
    rationale: "Introduces a cold mineral vein into the dark floral — like the smell of a stone floor in a room full of flowers. The contrast becomes architectural.",
    materials: [
      { name: "Rose Absolute", reason: "Still present but now set against colder elements." },
      { name: "Labdanum Absolute", reason: "The shadow anchor." },
      { name: "Ambroxan", reason: "Adds cold, mineral skin quality to offset the warmth of the floral-resin accord." },
    ],
  },
  {
    id: "ad-explore",
    label: "Explore another direction",
    directionId: "after-dark",
    keywords: ["Incense", "Woody depth", "Smoky", "Atmospheric"],
    rationale: "A further reading of the darkness in your references — less floral, more atmospheric. Incense and dry wood, something ceremonial.",
    materials: [
      { name: "Frankincense EO", reason: "Incense quality without becoming heavy. The smoke is clean." },
      { name: "Cedarwood Atlas", reason: "Dry woody structure — the bones of the accord." },
      { name: "Labdanum Absolute", reason: "Warm base that connects incense to skin." },
    ],
  },
  // Warm surface refinements
  {
    id: "ws-less-floral",
    label: "Less floral",
    directionId: "warm-surface",
    keywords: ["Resinous", "Dry wood", "Amber", "Warm mineral"],
    rationale: "Removes any softness that could read floral. Now purely resinous and woody — amber-adjacent without the sweetness.",
    materials: [
      { name: "Benzoin Resinoid", reason: "Still the warm heart, but now untempered." },
      { name: "Cedarwood Atlas", reason: "Dry and structural — counterbalances the resin." },
      { name: "Labdanum Absolute", reason: "Adds an animalic warmth that prevents the accord from going sweet." },
    ],
  },
  {
    id: "ws-more-mineral",
    label: "More mineral",
    directionId: "warm-surface",
    keywords: ["Warm mineral", "Dry", "Stone", "Textured amber"],
    rationale: "Introduces a cold mineral quality to the warm resinous direction. The warmth is still present but now sits beneath a cooler, more structural surface.",
    materials: [
      { name: "Vetiver", reason: "Dry and earthy — the mineral is expressed through its smoky, geological quality." },
      { name: "Ambroxan", reason: "Mineral skin-warmth that bridges the resinous and mineral territories." },
      { name: "Benzoin Resinoid", reason: "Remains as the warm base but is now secondary to the mineral character." },
    ],
  },
  {
    id: "ws-explore",
    label: "Explore another direction",
    directionId: "warm-surface",
    keywords: ["Warm spice", "Resinous", "Oud", "Deep texture"],
    rationale: "A richer reading of warmth — spice added to the resinous base. Darker and more complex, with an oud facet that reads as furniture rather than perfume.",
    materials: [
      { name: "Oud CO₂", reason: "The direction-defining material — woody, animalic, complex." },
      { name: "Benzoin Resinoid", reason: "The sweet resinous base that softens the oud." },
      { name: "Cardamom EO", reason: "Spice without heat. A fresh, aromatic quality that lifts the accord." },
    ],
  },
];

function MoodboardDemo({ BASE }: { BASE: string }) {
  const [selectedDir, setSelectedDir] = useState<string>("soft-focus");
  const [selectedRefinement, setSelectedRefinement] = useState<string | null>(null);

  const direction = SCENT_DIRECTIONS.find(d => d.id === selectedDir) ?? SCENT_DIRECTIONS[0];
  const activeRefinements = REFINEMENTS.filter(r => r.directionId === selectedDir);
  const refinement = selectedRefinement ? REFINEMENTS.find(r => r.id === selectedRefinement) : null;

  const displayKeywords = refinement ? refinement.keywords : direction.keywords;
  const displayRationale = refinement ? refinement.rationale : direction.rationale;
  const displayMaterials = refinement ? refinement.materials : direction.materials;

  const handleDirSelect = (id: string) => {
    setSelectedDir(id);
    setSelectedRefinement(null);
  };

  const handleRefinement = (id: string) => {
    setSelectedRefinement(prev => prev === id ? null : id);
  };

  const handleReset = () => {
    setSelectedRefinement(null);
  };

  return (
    <section
      id="moodboard-demo"
      className="border-t border-border"
      aria-label="One moodboard, three scent directions — interactive example"
      data-testid="section-moodboard-demo"
    >
      {/* ── Section header ── */}
      <motion.div
        className="px-8 py-10 sm:px-12 sm:py-12 border-b border-border"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <p className="font-mono-ui uppercase tracking-[.28em] text-muted-foreground" style={{ fontSize: "12px" }}>
            One moodboard. Three scent directions.
          </p>
          <span className="inline-flex items-center gap-1.5 border border-accent/35 px-2.5 py-1" style={{ fontSize: "11px" }}>
            <span className="inline-block h-1.5 w-1.5 bg-accent shrink-0" aria-hidden />
            <span className="font-mono-ui uppercase tracking-[.18em] text-accent-foreground/80">Interactive example — curated responses</span>
          </span>
        </div>
        <h2
          className="font-display tracking-[-0.03em] leading-[.9] text-foreground"
          style={{ fontSize: "clamp(1.8rem, 3.8vw, 3.2rem)" }}
          data-testid="heading-moodboard-demo"
        >
          See where your inspiration could lead.
        </h2>
        <p className="mt-4 leading-8 text-foreground/65 max-w-2xl" style={{ fontSize: "clamp(1rem, 1.6vw, 1.05rem)" }}>
          Bring together images, video, and notes. Explore possible scent directions you can question, reshape, and develop.
        </p>
      </motion.div>

      {/* ── Two-column body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">

        {/* LEFT — Your moodboard */}
        <motion.div
          className="border-b border-border lg:border-b-0 lg:border-r lg:border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55 }}
        >
          <div className="px-7 py-5 sm:px-9 border-b border-border">
            <p className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground" style={{ fontSize: "12px" }}>
              Your moodboard
            </p>
          </div>

          {/* Collage — three images: fogged glass, warm skin, dark lacquer */}
          <div className="relative" style={{ height: "clamp(220px, 28vw, 360px)" }}>
            {/* Fogged glass — left 48%, tall */}
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "48%", height: "92%", zIndex: 1 }}>
              <img
                src={BASE + "lait-vert-02.jpg"}
                alt="Fogged glass — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "glass-vessel-01.jpg"; }}
              />
            </div>
            {/* Warm skin — right 36%, top offset */}
            <div className="absolute overflow-hidden" style={{ top: "6%", left: "42%", width: "36%", height: "68%", zIndex: 2 }}>
              <img
                src={BASE + "human-skin-01.jpg"}
                alt="Warm skin — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Dark lacquer — bottom right */}
            <div className="absolute overflow-hidden" style={{ bottom: 0, right: 0, width: "38%", height: "48%", zIndex: 3 }}>
              <img
                src={BASE + "animal-mirror-01.jpg"}
                alt="Dark lacquer — example reference"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            {/* Acid citron connection node */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 4 }} aria-hidden>
              <circle cx="48%" cy="46%" r="3" fill="hsl(var(--accent))" />
              <circle cx="60%" cy="46%" r="3" fill="hsl(var(--accent))" />
              <line x1="48%" y1="46%" x2="60%" y2="46%" stroke="hsl(var(--border))" strokeWidth="0.8" strokeDasharray="2 3" />
            </svg>
          </div>

          {/* Example note — clearly labeled user input */}
          <div className="px-7 py-5 sm:px-9 border-t border-border">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="font-mono-ui uppercase tracking-[.14em] border border-border text-muted-foreground/70 px-2 py-0.5" style={{ fontSize: "11px" }}>
                Example note — user input
              </span>
            </div>
            <p
              className="leading-8 text-foreground/75"
              style={{ fontSize: "clamp(1rem, 1.6vw, 1.05rem)", fontStyle: "italic" }}
            >
              &ldquo;Something intimate, warm, and a little strange. Nothing sugary.&rdquo;
            </p>
          </div>
        </motion.div>

        {/* RIGHT — Suggested directions */}
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="px-7 py-5 sm:px-9 border-b border-border">
            <p className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground mb-1" style={{ fontSize: "12px" }}>
              Suggested directions
            </p>
            <p className="text-muted-foreground/70" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
              Three possible interpretations of the same moodboard. Choose one to explore.
            </p>
          </div>

          {/* Direction cards — three equal, selectable */}
          <div
            role="radiogroup"
            aria-label="Scent directions"
            className="border-b border-border"
          >
            {SCENT_DIRECTIONS.map(dir => {
              const isActive = selectedDir === dir.id;
              return (
                <button
                  key={dir.id}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleDirSelect(dir.id)}
                  data-testid={`direction-card-${dir.id}`}
                  className={[
                    "w-full text-left px-7 py-5 sm:px-9 border-t border-border first:border-t-0",
                    "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                    isActive
                      ? "bg-foreground/4 border-l-2 border-l-accent"
                      : "hover:bg-secondary/30",
                  ].join(" ")}
                  style={{ borderLeft: isActive ? "2px solid hsl(var(--accent))" : undefined }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 mt-1 h-3.5 w-3.5 border flex items-center justify-center transition-colors ${isActive ? "border-accent bg-accent" : "border-border bg-background"}`}
                      aria-hidden
                    >
                      {isActive && <span className="h-1.5 w-1.5 bg-background block" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono-ui uppercase tracking-[.16em] text-foreground/85 mb-0.5" style={{ fontSize: "14px" }}>
                        {dir.label}
                      </p>
                      <p className="text-muted-foreground leading-6" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
                        {dir.tagline}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected direction output */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDir + (selectedRefinement ?? "")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="px-7 py-6 sm:px-9 flex-1"
              aria-live="polite"
              aria-atomic="true"
            >
              {/* Keywords */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {displayKeywords.map(kw => (
                  <span
                    key={kw}
                    className="border border-border px-2.5 py-1 font-mono-ui uppercase tracking-[.12em] text-foreground/65"
                    style={{ fontSize: "12px" }}
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* Plain-language rationale */}
              <p className="leading-8 text-foreground/70 mb-5" style={{ fontSize: "clamp(1rem, 1.5vw, 1rem)" }}>
                {displayRationale}
              </p>

              {/* Candidate materials */}
              <div className="space-y-3 mb-6">
                <p className="font-mono-ui uppercase tracking-[.18em] text-muted-foreground" style={{ fontSize: "11px" }}>
                  Candidate materials to explore
                </p>
                {displayMaterials.map(mat => (
                  <div key={mat.name} className="flex gap-3">
                    <span className="inline-block h-[3px] w-[3px] bg-accent shrink-0 mt-2.5" aria-hidden />
                    <div>
                      <p className="font-mono-ui uppercase tracking-[.14em] text-foreground/80" style={{ fontSize: "13px" }}>
                        {mat.name}
                      </p>
                      <p className="text-muted-foreground leading-6 mt-0.5" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
                        {mat.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refinement controls */}
              <div className="border-t border-border pt-5">
                <p className="font-mono-ui uppercase tracking-[.18em] text-muted-foreground mb-3" style={{ fontSize: "12px" }}>
                  What would you change?
                </p>
                <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Refinement options">
                  {activeRefinements.map(ref => (
                    <button
                      key={ref.id}
                      onClick={() => handleRefinement(ref.id)}
                      aria-pressed={selectedRefinement === ref.id}
                      data-testid={`refinement-${ref.id}`}
                      className={[
                        "px-4 py-2 font-mono-ui uppercase tracking-[.14em] border transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                        selectedRefinement === ref.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-foreground/65 hover:border-foreground/50 hover:text-foreground",
                      ].join(" ")}
                      style={{ fontSize: "14px", minHeight: "40px" }}
                    >
                      {ref.label}
                    </button>
                  ))}
                  {selectedRefinement && (
                    <button
                      onClick={handleReset}
                      data-testid="refinement-reset"
                      className="px-4 py-2 font-mono-ui uppercase tracking-[.14em] text-muted-foreground/55 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                      style={{ fontSize: "14px", minHeight: "40px" }}
                      aria-label="Reset to original direction"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="font-mono-ui text-muted-foreground/45" style={{ fontSize: "11px" }}>
                  Curated responses — not live generation
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── CTA ── */}
      <div className="px-8 py-8 sm:px-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <p className="leading-8 text-foreground/65 max-w-md" style={{ fontSize: "clamp(1rem, 1.6vw, 1.05rem)" }}>
          Your references start the conversation. You decide where it goes.
        </p>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            href="/sign-up"
            data-testid="button-demo-create-moodboard"
            className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.18em] hover:opacity-80 transition-opacity"
            style={{ fontSize: "14px", minHeight: "48px" }}
          >
            Create your own moodboard
            <ArrowRight size={11} strokeWidth={1.5} />
          </Link>
          <Link
            href="/example"
            data-testid="button-demo-explore-example"
            className="inline-flex items-center gap-2 border border-foreground/20 px-5 py-3.5 font-mono-ui uppercase tracking-[.18em] text-foreground/55 hover:border-foreground/40 hover:text-foreground transition-colors"
            style={{ fontSize: "14px", minHeight: "48px" }}
          >
            Explore an example
          </Link>
        </div>
      </div>
      <p className="px-8 pb-5 sm:px-12 font-mono-ui text-muted-foreground/45" style={{ fontSize: "11px" }}>
        An account is required to create and save your own moodboard. Exploring this example does not require sign-in.
      </p>
    </section>
  );
}

function Landing() {
  const BASE = import.meta.env.BASE_URL + "images/";

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Monumental MATIÈRE masthead (800–900 weight), secondary proposition,
          explanatory copy, dual CTAs. Readable nav at 14–15px.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "100dvh" }}
        data-testid="landing-hero"
        aria-label="Hero"
      >
        {/* Warm parchment ground */}
        <div className="absolute inset-0 bg-background" />

        {/* Right-side photograph — warm skin, editorial */}
        <motion.div
          className="absolute inset-y-0 right-0 overflow-hidden"
          style={{ width: "55%" }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <img
            src={BASE + "human-skin-01.jpg"}
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-center"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "hero-editorial.jpg"; }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)/0.55) 22%, transparent 55%)" }}
          />
        </motion.div>

        {/* ── Nav ── */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-7 sm:px-12"
        >
          {/* Logo — always readable */}
          <Link
            href="/"
            data-testid="link-brand-landing"
            className="font-mono-ui font-medium tracking-[.32em] uppercase text-foreground/85 hover:opacity-60 transition-opacity"
            style={{ fontSize: "11px" }}
          >
            MATIÈ<span>R</span>E
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Site navigation">
            <Link
              href="/example"
              data-testid="link-landing-nav-example"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              See an example
            </Link>
            <a
              href="#platform"
              data-testid="link-landing-nav-platform"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              The workspace
            </a>
            <Link
              href="/sign-up"
              data-testid="link-landing-nav-create"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              Create
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <Link
              href="/sign-in"
              data-testid="link-landing-sign-in"
              className="font-mono-ui uppercase tracking-[.22em] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: "14px" }}
            >
              Sign in
            </Link>
          </div>
        </motion.header>

        {/* ── Hero copy ── */}
        <div
          className="relative z-10 flex flex-col justify-center px-8 sm:px-12 font-medium"
          style={{ minHeight: "100dvh" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[52%] min-w-[280px] mt-[-42px] mb-[-42px]"
          >
            {/* ── Secondary proposition — above the masthead ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="font-mono-ui uppercase tracking-[.30em] text-muted-foreground font-medium text-[19px] mt-[-12px] mb-[10px]"
            >
              Fragrance beyond boundaries
            </motion.p>

            {/* ── Monumental MATIÈRE masthead ── */}
            <h1
              data-testid="heading-landing"
              className="font-title text-foreground text-[109px] pt-[0px] pb-[0px]"
              style={{
                fontSize: "clamp(4.5rem, 13vw, 14rem)",
                fontWeight: 900,
                letterSpacing: "-0.025em",
              }}
            >
              MATI<span>È</span>RE
            </h1>

            {/* ── Explanatory copy ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="leading-8 text-foreground/65 max-w-sm mt-[-12px]"
              style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}
            >
              Build a moodboard from images, video, and notes. Explore AI-suggested scent directions and materials, then develop your fragrance in one creative workspace.
            </motion.p>

            {/* ── CTAs ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.62 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/sign-up"
                data-testid="button-landing-create-moodboard"
                className="inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] hover:opacity-80 transition-opacity text-[20px]"
                style={{ minHeight: "48px" }}
              >
                Create a moodboard
                <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
              <Link
                href="/example"
                data-testid="button-landing-explore-example"
                className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] text-foreground/60 hover:border-foreground/50 hover:text-foreground transition-colors"
                style={{ fontSize: "14px", minHeight: "48px" }}
              >
                Explore an example
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative vertical micro-copy — non-essential */}
          <motion.div
            className="absolute bottom-9 left-8 sm:left-12 z-10 flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            aria-hidden
          >
            <div className="h-[1px] w-6 bg-foreground/25" />
            <p
              className="font-mono-ui uppercase tracking-[.24em] text-foreground/30 leading-5"
              style={{ fontSize: "9px", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              A new language for scent
            </p>
          </motion.div>
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — ONE MOODBOARD. THREE SCENT DIRECTIONS.
          Interactive demo: left collage + note, right selectable directions.
          Fully curated — no live AI. Keyboard/touch/reduced-motion accessible.
      ══════════════════════════════════════════════════════════════════════ */}
      <MoodboardDemo BASE={BASE} />
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — EDITORIAL FEATURE MODULES
          Four modular panels. Moodboard is primary.
          Typography: headings ~28–40px, body 16–18px, labels 14px.
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border" aria-label="Feature modules">

        {/* Row 1 — four columns, moodboard dominant */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
          style={{ minHeight: "clamp(360px, 48vw, 600px)" }}
        >
          {/* A — Botanical still life */}
          <motion.div
            className="relative overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ minHeight: "clamp(260px, 30vw, 400px)" }}
          >
            <img
              src={BASE + "petal-01.jpg"}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "lait-vert-01.jpg"; }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--foreground)/0.55) 28%, transparent 66%)" }} />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8" aria-hidden>
              <p className="font-mono-ui uppercase tracking-[.18em] text-white/50 mb-1" style={{ fontSize: "12px" }}>Raw</p>
              <p className="font-mono-ui uppercase tracking-[.14em] text-white/45" style={{ fontSize: "12px" }}>Natural · synthetic · together</p>
            </div>
          </motion.div>

          {/* B — Ingredient world (dark) */}
          <motion.div
            className="relative flex flex-col justify-end p-6 sm:p-8 dark-cinematic"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.06 }}
          >
            <img
              src={BASE + "animal-mirror-01.jpg"}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="relative z-10">
              <h3
                className="font-display leading-[.88] tracking-[-0.02em] text-white"
                style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)" }}
              >
                Explore a world of ingredients
              </h3>
              <div className="mt-4 h-[1px] w-5 bg-white/25" aria-hidden />
              <Link
                href="/sign-up"
                data-testid="link-landing-discover"
                className="mt-4 inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-white/55 hover:text-white transition-colors"
                style={{ fontSize: "13px" }}
              >
                Browse the library
                <ArrowRight size={10} strokeWidth={1.5} />
              </Link>
              <p className="mt-2 font-mono-ui uppercase tracking-[.12em] text-white/30" style={{ fontSize: "11px" }}>Sign in required</p>
            </div>
          </motion.div>

          {/* C — Moodboard / Canvas (light, most prominent text) */}
          <motion.div
            className="relative overflow-hidden bg-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <img
              src={BASE + "moodboard-01.jpg"}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "sel-gris-01.jpg"; }}
            />
            <div className="absolute inset-0 bg-background/45" />
            <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-7">
              <div>
                <h3
                  className="font-display leading-[.90] tracking-[-0.02em] text-foreground"
                  style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}
                >
                  Build your moodboard
                </h3>
                <p className="mt-3 leading-7 text-muted-foreground" style={{ fontSize: "clamp(0.875rem, 1.4vw, 0.9rem)" }}>
                  Images, video, and notes. Visual culture and formula precision as one process.
                </p>
              </div>
              <div>
                <div className="mb-4 h-[1px] w-5 bg-foreground/25" aria-hidden />
                <Link
                  href="/sign-up"
                  data-testid="link-landing-canvas"
                  className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-foreground/55 hover:text-foreground transition-colors"
                  style={{ fontSize: "13px" }}
                >
                  Create a moodboard <ArrowRight size={10} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* D — Precision meets poetry (dropper dark) — heading always visible */}
          <motion.div
            className="relative overflow-hidden dark-cinematic"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.14 }}
          >
            <img
              src={BASE + "dropper-01.jpg"}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-50"
              onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "resine-noire-01.jpg"; }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--foreground)/0.78) 18%, transparent 65%)" }} />
            <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-7">
              {/* Always visible — not hidden behind animation */}
              <div className="text-right">
                <h3
                  className="font-display leading-[.88] tracking-[-0.02em] text-white"
                  style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)" }}
                >
                  Precision meets poetry
                </h3>
              </div>
              <div>
                <div className="mb-3 h-[1px] w-5 bg-white/22" aria-hidden />
                <Link
                  href="/sign-up"
                  data-testid="link-landing-formula-workspace"
                  className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.20em] text-white/45 hover:text-white transition-colors"
                  style={{ fontSize: "13px" }}
                >
                  Formula workspace <ArrowRight size={10} strokeWidth={1.5} />
                </Link>
                <p className="mt-1 font-mono-ui uppercase tracking-[.12em] text-white/28" style={{ fontSize: "11px" }}>Sign in required</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2 — human portrait + platform text */}
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] border-t border-border">
          <motion.div
            className="relative overflow-hidden"
            style={{ minHeight: "clamp(300px, 40vw, 480px)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={BASE + "human-skin-01.jpg"}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "hero-editorial.jpg"; }}
            />
            <div className="absolute top-0 right-0 p-7 flex flex-col gap-1.5 text-right hidden sm:flex" aria-hidden>
              {["A new", "language", "for scent"].map(w => (
                <p key={w} className="font-mono-ui uppercase tracking-[.20em] text-white/45" style={{ fontSize: "11px" }}>{w}</p>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="flex flex-col justify-between p-8 sm:p-12 bg-background border-l border-border"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            <div>
              <h3
                className="font-display leading-[.9] tracking-[-0.02em] text-foreground"
                style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)" }}
              >
                A fragrance workspace for what comes next
              </h3>
              <div className="mt-4 h-[1px] w-6 bg-foreground/22" aria-hidden />
              <p className="mt-5 font-mono-ui uppercase tracking-[.16em] text-muted-foreground" style={{ fontSize: "13px" }}>
                Sillage Lab — the MATIÈRE creation workspace
              </p>
              <p className="mt-5 leading-8 text-muted-foreground max-w-xs" style={{ fontSize: "clamp(0.95rem, 1.5vw, 1rem)" }}>
                Where visual culture, olfactive science, and AI interpretation work as one creative system. Your moodboards, notes, materials, and formula versions stay connected.
              </p>
            </div>
            <div className="mt-8">
              <div className="mb-4 h-[1px] w-6 bg-foreground/18" aria-hidden />
              <a
                href="#platform"
                data-testid="link-landing-learn-more"
                className="inline-flex items-center gap-2 font-mono-ui uppercase tracking-[.22em] text-foreground/50 hover:text-foreground transition-colors"
                style={{ fontSize: "13px" }}
              >
                Learn more <ArrowRight size={10} strokeWidth={1.5} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — PLATFORM FUNCTIONALITY
          Accurate descriptions of what exists. Planned features labeled.
          id="platform" for Learn more link target.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="platform"
        className="border-t border-border px-8 py-16 sm:px-12 sm:py-20"
        aria-label="What MATIÈRE does"
        data-testid="section-platform"
      >
        <div className="mb-12">
          <p className="font-mono-ui uppercase tracking-[.28em] text-muted-foreground mb-3" style={{ fontSize: "12px" }}>
            The workspace
          </p>
          <h2
            className="font-display leading-[.9] tracking-[-0.03em] text-foreground max-w-2xl"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            One process from inspiration to formula
          </h2>
          <p className="mt-5 leading-8 text-foreground/65 max-w-2xl" style={{ fontSize: "clamp(1rem, 1.7vw, 1.1rem)" }}>
            MATIÈRE keeps your moodboard, notes, material selections, and formula versions connected in a single private workspace. Below is an honest account of what is currently available.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {[
            {
              label: "Image and reference workspace",
              status: "Available",
              body: "Build a moodboard by uploading images and arranging them on a freeform canvas. Add text, notes, material cards, and directional annotations. Drag, resize, stack, and connect references.",
            },
            {
              label: "AI scent interpretation",
              status: "Available",
              body: "Select images or a group of references on the canvas and interpret them into olfactive qualities, tensions, and material territory. Results are contextual and based on your canvas content — not live generation for this example.",
            },
            {
              label: "Formula ideation and builder",
              status: "Available",
              body: "Create formula records with a brief, ingredient list, concentrations, roles, and dilutions. Track version history. Move through a nine-stage workflow from concept to batch sheet.",
            },
            {
              label: "Material library",
              status: "Available",
              body: "Browse a curated ingredient library with olfactive families, notes, and descriptions. Search and filter. Link materials to your moodboard and formula.",
            },
            {
              label: "IFRA guidance",
              status: "Available — guidance only",
              body: "Check ingredients against IFRA category limits for a specified product type. Presented as guidance for reference — always confirm with your supplier and regulatory advisor before manufacture.",
            },
            {
              label: "Collaboration — shared briefs and comments",
              status: "Planned",
              body: "Shared projects, comments, and feedback loops between collaborators are on the roadmap. Not yet available.",
            },
          ].map(item => (
            <motion.div
              key={item.label}
              className="bg-background p-7 sm:p-8"
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-block h-1 w-1 bg-accent shrink-0 mt-2" aria-hidden />
                <div>
                  <p className="font-mono-ui uppercase tracking-[.16em] text-foreground/80 leading-snug" style={{ fontSize: "13px" }}>
                    {item.label}
                  </p>
                  <span
                    className={`inline-block mt-1 font-mono-ui uppercase tracking-[.12em] border px-1.5 py-0.5 ${
                      item.status === "Planned"
                        ? "border-border text-muted-foreground/50"
                        : item.status.includes("guidance")
                        ? "border-accent/30 text-accent-foreground/70"
                        : "border-border text-muted-foreground"
                    }`}
                    style={{ fontSize: "10px" }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              <p className="leading-7 text-muted-foreground" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — FUTURE ECOSYSTEM (compact, clearly labeled)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-border px-8 py-12 sm:px-12"
        aria-label="MATIÈRE ecosystem"
        data-testid="section-ecosystem"
      >
        <p className="font-mono-ui uppercase tracking-[.26em] text-muted-foreground mb-8" style={{ fontSize: "12px" }}>
          Beyond the workspace
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {[
            {
              name: "Shop",
              status: "Coming soon",
              body: "Curated materials, accords, and sample collections for the working perfumer.",
            },
            {
              name: "Custom fragrance experiences",
              status: "Coming soon",
              body: "Guided commissions — a bespoke fragrance developed with a MATIÈRE perfumer, using the same tools.",
            },
            {
              name: "Workshops",
              status: "Planned",
              body: "In-person and digital workshops connecting the platform's creative process with hands-on blending.",
            },
            {
              name: "Artist collaborations",
              status: "Planned",
              body: "Projects with artists, designers, and cultural figures — fragrance as material in a broader practice.",
            },
          ].map(item => (
            <div key={item.name} className="bg-background p-6 sm:p-7">
              <p className="font-mono-ui uppercase tracking-[.16em] text-foreground/75 mb-1" style={{ fontSize: "13px" }}>
                {item.name}
              </p>
              <span
                className="inline-block font-mono-ui uppercase tracking-[.12em] border border-border text-muted-foreground/50 px-1.5 py-0.5 mb-4"
                style={{ fontSize: "10px" }}
              >
                {item.status}
              </span>
              <p className="leading-7 text-muted-foreground" style={{ fontSize: "clamp(0.875rem, 1.3vw, 0.9rem)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 font-mono-ui uppercase tracking-[.14em] text-muted-foreground/50" style={{ fontSize: "11px" }}>
          The creative workspace is the primary focus. All ecosystem offerings will be introduced here as they become available.
        </p>
      </section>
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
          Strong "Create a moodboard" close.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-t border-border grid grid-cols-1 sm:grid-cols-[1fr_1fr]"
        aria-label="Create a moodboard"
      >
        <motion.div
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(200px, 24vw, 300px)" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          aria-hidden
        >
          <img
            src={BASE + "glass-vessel-01.jpg"}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).src = BASE + "lait-vert-02.jpg"; }}
          />
        </motion.div>
        <motion.div
          className="flex flex-col justify-center px-8 py-12 sm:px-12 bg-background border-l border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
        >
          <p className="font-mono-ui uppercase tracking-[.26em] text-muted-foreground mb-4" style={{ fontSize: "12px" }}>
            Sillage Lab — the MATIÈRE creation workspace
          </p>
          <h2
            className="font-display leading-[.9] tracking-[-0.03em] text-foreground"
            style={{ fontSize: "clamp(1.8rem, 3.6vw, 3.2rem)" }}
          >
            From world<br />to scent.
          </h2>
          <p className="mt-5 leading-8 text-foreground/65 max-w-xs" style={{ fontSize: "clamp(1rem, 1.5vw, 1rem)" }}>
            Your moodboard, notes, materials, and formula — one connected workspace, private to your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-up"
              data-testid="link-landing-create-final"
              className="group inline-flex items-center gap-2.5 bg-foreground text-background px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] hover:opacity-80 transition-opacity"
              style={{ fontSize: "14px", minHeight: "48px" }}
            >
              Create a moodboard
              <ArrowRight size={11} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/example"
              data-testid="link-landing-example-final"
              className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3.5 font-mono-ui uppercase tracking-[.20em] text-foreground/55 hover:border-foreground/40 hover:text-foreground transition-colors"
              style={{ fontSize: "14px", minHeight: "48px" }}
            >
              Explore an example
            </Link>
          </div>
        </motion.div>
      </section>
      {/* ── Footer ── */}
      <footer className="border-t border-border px-8 py-6 sm:px-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="font-mono-ui uppercase tracking-[.20em] text-muted-foreground" style={{ fontSize: "11px" }}>
            MATIÈRE
          </span>
          <span className="font-mono-ui text-muted-foreground/45" style={{ fontSize: "10px" }}>
            Made for the long drydown.
          </span>
        </div>
      </footer>
    </div>
  );
}
// ─── New page imports ─────────────────────────────────────────────────────────
import { Studio } from "./pages/Studio";
import { Projects } from "./pages/Projects";
import { ProjectWorkspace } from "./pages/ProjectWorkspace";
import { Inspiration } from "./pages/Inspiration";
import { MaterialDetail } from "./pages/MaterialDetail";
import { PublicExample } from "./pages/PublicExample";

// Thin shell wrappers (keep Shell in sillage.tsx for Sidebar/MobileNav access)
function StudioPage() { return <Studio />; }
function ProjectsPage() { return <Projects />; }
function ProjectWorkspacePage() { return <ProjectWorkspace />; }
function InspirationPage() { return <Inspiration />; }
function MaterialDetailPage() { return <MaterialDetail />; }
function PublicExamplePage() { return <PublicExample />; }

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-background"><Skeleton className="h-8 w-32" /></div>;
  return isSignedIn ? <>{children}</> : <Redirect to="/sign-in" />;
}

function AuthPage({ kind }: { kind: "in" | "up" }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      {/* Background image — very subtle wash on the right side */}
      <div className="absolute inset-0 hidden sm:block">
        <img
          src={BASE + (kind === "in" ? "sel-gris-01.jpg" : "lait-vert-01.jpg")}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(var(--background) / 0.98) 0%, hsl(var(--background) / 0.92) 40%, hsl(var(--background) / 0.72) 100%)" }} />
      </div>
      {/* Logo */}
      <div className="absolute left-7 top-7 sm:left-12 sm:top-8 z-10">
        <Logo />
      </div>
      {/* Auth form */}
      <div className="relative z-10 grid min-h-[100dvh] place-items-center px-4 py-16">
        <div className="w-full max-w-[440px] border border-border bg-card p-1 shadow-sm">
          {kind === "in"
            ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath || ""}/`} />
            : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath || ""}/`} />
          }
        </div>
        {/* Bottom copy */}
        <p className="absolute bottom-8 font-mono-ui text-[7px] uppercase tracking-[.22em] text-muted-foreground/60">
          {kind === "in" ? "Return to the studio." : "A place for the work between first thought and final blotter."}
        </p>
      </div>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Page not found · 404</p>
        <h1 className="mt-4 font-display text-6xl">A missing page.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          This page drifted out of the notebook.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href="/" testId="button-return-home">Return to MATIÈRE</Button>
        </div>
      </div>
    </div>
  );
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: "hsl(var(--primary))", colorForeground: "hsl(var(--foreground))", colorMutedForeground: "hsl(var(--muted-foreground))", colorBackground: "hsl(var(--background))", colorInput: "hsl(var(--input))", colorInputForeground: "hsl(var(--foreground))", colorDanger: "hsl(var(--destructive))", colorNeutral: "hsl(var(--border))", fontFamily: "Inter", borderRadius: "0rem" }, elements: { cardBox: "bg-card border border-border w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-foreground font-medium", headerSubtitle: "text-muted-foreground", formFieldLabel: "text-foreground", formFieldInput: "bg-secondary text-foreground border border-border", formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-80 rounded-none uppercase tracking-widest text-[11px]", footerActionLink: "text-foreground underline", socialButtonsBlockButtonText: "text-foreground", socialButtonsBlockButton__google: "!hidden", dividerRow: "!hidden", dividerText: "text-muted-foreground", footerActionText: "text-muted-foreground" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Switch>
      <Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} />
      <Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} />
      {/* Public routes — no auth gate */}
      <Route path="/"><Landing /></Route>
      <Route path="/example"><PublicExamplePage /></Route>
      {/* Authenticated routes */}
      <Route path="/dashboard"><Redirect to="/studio" /></Route>
      <Route path="/studio"><Protected><Shell><StudioPage /></Shell></Protected></Route>
      <Route path="/projects/:id/inspiration"><Protected><Shell><InspirationPage /></Shell></Protected></Route>
      <Route path="/projects/:id"><Protected><Shell><ProjectWorkspacePage /></Shell></Protected></Route>
      <Route path="/projects"><Protected><Shell><ProjectsPage /></Shell></Protected></Route>
      <Route path="/formulas/new"><Protected><NewFormula /></Protected></Route>
      <Route path="/formulas/:id"><Protected><FormulaDetail /></Protected></Route>
      <Route path="/formulas"><Protected><Formulas /></Protected></Route>
      <Route path="/materials/:id"><Protected><Shell><MaterialDetailPage /></Shell></Protected></Route>
      <Route path="/materials"><Protected><Materials /></Protected></Route>
      <Route path="/files"><Protected><FileDrawer /></Protected></Route>
      <Route path="/coach"><Protected><Coach /></Protected></Route>
      <Route path="/shop"><Protected><Shop /></Protected></Route>
      <Route><NotFoundView /></Route>
    </Switch></WouterRouter></QueryClientProvider>
  </ClerkProvider>;
}
