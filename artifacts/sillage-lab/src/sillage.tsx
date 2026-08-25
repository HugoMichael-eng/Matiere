import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Beaker, Bookmark, BookOpen, ChevronDown, ChevronRight, CircleAlert,
  Download, File, FileImage, FileText, FlaskConical, FolderUp, Gauge, Leaf, LogOut, Menu, MessageCircle, Minus, Paperclip, Plus,
  Pencil, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, Upload, X, ShoppingBag
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Redirect, Route, Switch, useLocation, useParams, useSearch, Router as WouterRouter } from "wouter";
import {
  getGetConversationQueryKey, getGetDashboardSummaryQueryKey, getGetFormulaEventsQueryKey, getGetFormulaQueryKey,
  getListConversationsQueryKey, getListFormulasQueryKey,
  useCreateConversation, useCreateFormula, useDeleteConversation, useDeleteFormula,
  useGetActivity, useGetConversation, useGetDashboardSummary, useGetFormula,
  useGetFormulaEvents, useListConversations, useListFormulas, useListMaterials,
  useSendConversationMessage, useUpdateFormula,
} from "@workspace/api-client-react";
import type { Formula, FormulaIngredientInput, Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";
import { MarkdownMessage } from "./components/MarkdownMessage";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className="flex items-center gap-3 group">
      <span className={`font-mono-ui text-[10px] font-medium uppercase tracking-[.35em] ${light ? "text-white" : "text-foreground"}`}>MATIÈRE</span>
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
  if (href) return <Link href={href} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-80 border-t-[#140f0b05] border-r-[#140f0b05] border-b-[#140f0b05] border-l-[#140f0b05] text-white bg-[#000000]" data-testid={testId}>{children}</Link>;
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
  { href: "/coach", label: "Creative lab", icon: MessageCircle },
  { href: "/dashboard", label: "Studio desk", icon: Gauge },
  { href: "/formulas", label: "Formula library", icon: BookOpen },
  { href: "/materials", label: "Materials", icon: Leaf },
  { href: "/files", label: "File drawer", icon: FolderUp },
  { href: "/shop", label: "Shop & source", icon: ShoppingBag },
];

function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <aside className="hidden min-h-[100dvh] w-[220px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex border-r border-border">
      <Logo light />
      <div className="mt-12">
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return <Link href={href} key={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
              className={`flex items-center gap-3 px-3 py-3 text-[10px] tracking-[.18em] uppercase font-medium transition-colors ${active ? "border-l-2 border-accent text-white" : "text-white/50 hover:text-white"}`}>
              <Icon size={14} strokeWidth={1.7} /><span>{label}</span>
            </Link>;
          })}
        </nav>
      </div>
      <div className="mt-auto">
        <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
          <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-medium text-white">{user?.firstName ?? "Independent perfumer"}</p><p className="truncate text-[9px] text-white/50">{user?.primaryEmailAddress?.emailAddress ?? "Studio account"}</p></div>
          <button onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-sign-out" className="text-white/50 hover:text-white" aria-label="Sign out"><LogOut size={14} /></button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
      <Logo />
      <motion.button
        onClick={() => setOpen(!open)}
        data-testid="button-mobile-menu"
        className="p-2 text-muted-foreground hover:bg-secondary"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {open ? <X size={19} /> : <Menu size={19} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            className="absolute left-0 right-0 top-full z-40 border-b border-border bg-background shadow-lg"
          >
            {navItems.map(({ href, label, icon: Icon }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + i * 0.04, duration: 0.18, ease: "easeOut" }}
              >
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`}
                  className="flex items-center gap-3 border-t border-border px-5 py-4 text-xs uppercase tracking-widest hover:bg-secondary"
                >
                  <Icon size={14} />
                  {label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100dvh] bg-background animate-fade-in"><Sidebar /><div className="min-w-0 flex-1"><MobileNav /><main className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">{children}</main></div></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-0 flex flex-col justify-between gap-4 border-b border-border pt-8 pb-6 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.3em] text-muted-foreground">{eyebrow}</p><h1 className="mt-2 font-display text-5xl tracking-[-0.03em] leading-[.85] text-foreground sm:text-6xl" data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h1>{description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</header>;
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

function useCountUp(target: number, duration = 1100) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const id = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return count;
}

function MetricCard({ label, value, Icon, delay, testId, href }: { label: string; value: number; Icon: LucideIcon; delay: number; testId: string; href: string }) {
  const count = useCountUp(value);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glow = useMotionTemplate`radial-gradient(180px at ${mouseX}px ${mouseY}px, hsl(var(--accent) / 0.28), transparent 80%)`;

  return (
    <Link href={href}>
      <motion.div
        ref={cardRef}
        data-testid={testId}
        onMouseMove={e => {
          const r = cardRef.current?.getBoundingClientRect();
          if (!r) return;
          mouseX.set(e.clientX - r.left);
          mouseY.set(e.clientY - r.top);
        }}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -3, transition: { duration: 0.16 } }}
        whileTap={{ scale: 0.97 }}
        className="group relative overflow-hidden bg-card p-6 text-foreground cursor-pointer"
      >
        {/* Cursor glow */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow }} />
        <div className="relative flex items-start justify-between">
          <p className="max-w-[120px] text-[11px] leading-4 text-muted-foreground">{label}</p>
          <motion.div whileHover={{ scale: 1.25, rotate: 8 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
            <Icon size={17} strokeWidth={1.6} className="text-muted-foreground transition-colors group-hover:text-foreground" />
          </motion.div>
        </div>
        <p className="relative mt-5 font-display text-4xl">{count}</p>
        <p className="relative mt-1 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </p>
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
  const glowBg = useMotionTemplate`radial-gradient(420px circle at ${glowL} ${glowT}, rgba(255,255,255,0.055) 0%, transparent 65%)`;

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
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
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

// ── Stage pipeline: clickable, hover reveals "View →" ─────
function StageTrack({ counts, total }: { counts: Record<"draft" | "resting" | "approved", number>; total: number }) {
  const stages = (["draft", "resting", "approved"] as const);
  const labels = { draft: "Draft", resting: "Resting", approved: "Approved" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-3 border-b border-border overflow-hidden"
    >
      {stages.map((stage, i) => {
        const count = counts[stage];
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <Link key={stage} href={`/formulas?status=${stage}`} data-testid={`link-stage-${stage}`}>
            <motion.div
              className={`group relative px-6 py-7 cursor-pointer ${i < 2 ? "border-r border-border" : ""}`}
              whileHover="hovered" initial="idle"
            >
              {/* Hover background */}
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-secondary/60"
                variants={{ idle: { opacity: 0 }, hovered: { opacity: 1 } }}
                transition={{ duration: 0.18 }}
              />
              <div className="relative">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">{labels[stage]}</p>
                <motion.p
                  className="mt-2 font-display text-4xl"
                  variants={{ idle: { y: 0 }, hovered: { y: -3 } }}
                  transition={{ type: "spring", stiffness: 360, damping: 18 }}
                >
                  {count}
                </motion.p>
                {/* Progress bar */}
                <div className="mt-3 h-[2px] w-full overflow-hidden bg-border">
                  <motion.div
                    className="h-full bg-foreground"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                {/* "View →" reveals on hover */}
                <motion.p
                  className="mt-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground"
                  variants={{ idle: { opacity: 0, y: 5 }, hovered: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.16 }}
                >
                  View formulas →
                </motion.p>
              </div>
              {/* Connector chevron */}
              {i < 2 && (
                <ChevronRight
                  size={11}
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-[55%] bg-card text-border transition-colors group-hover:text-foreground/30"
                />
              )}
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
}

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
  const glowBg = useMotionTemplate`radial-gradient(520px circle at ${glowL} ${glowT}, rgba(255,255,255,0.065) 0%, transparent 62%)`;

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
      <Link href="/materials" data-testid="link-material-hero">
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
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
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

function QuickPrompt({ greeting, weekday }: { greeting: string; weekday: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 70, damping: 20 });
  const sy = useSpring(my, { stiffness: 70, damping: 20 });
  const imgX = useTransform(sx, [0, 1], ["-2%", "2%"]);
  const imgY = useTransform(sy, [0, 1], ["-2%", "2%"]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      className="relative overflow-hidden border-b border-border bg-foreground -mx-5 sm:-mx-8 lg:-mx-12"
    >
      {/* Photo texture layer — parallax on desktop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-[-4%] will-change-transform"
        style={{ x: imgX, y: imgY }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hero-droplets.jpg`}
          alt=""
          className="h-full w-full object-cover opacity-[0.13] mix-blend-luminosity"
        />
      </motion.div>
      {/* SVG grain / noise overlay */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <filter id="qp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#qp-grain)" />
      </svg>

      {/* Content */}
      <div className="relative flex flex-col px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        {/* Top row: eyebrow + quiet secondary action */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="font-mono-ui text-[9px] uppercase tracking-[.32em] text-white/40">
            {weekday} · studio desk
          </p>
          <Link
            href="/formulas/new"
            data-testid="button-new-formula"
            className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-white/40 transition-colors hover:text-white/80"
          >
            New formula
          </Link>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          data-testid={`heading-${`${greeting}, maker.`.toLowerCase().replaceAll(" ", "-")}`}
          className="mt-4 font-display leading-[.88] tracking-[-0.03em] text-white"
          style={{ fontSize: "clamp(2.4rem, 7vw, 6rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {greeting}, maker.
        </motion.h1>
      </div>
    </div>
  );
}

function Dashboard() {
  const [, setLocation] = useLocation();
  const summaryQuery = useGetDashboardSummary();
  const draftsQuery = useListFormulas({ status: "draft" });
  const restingQuery = useListFormulas({ status: "resting" });
  const approvedQuery = useListFormulas({ status: "approved" });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  const weekday = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: "long" }), []);
  const summary = summaryQuery.data;
  const activityQuery = useGetActivity({});
  const stageCounts = {
    draft: draftsQuery.data?.length ?? 0,
    resting: restingQuery.data?.length ?? 0,
    approved: approvedQuery.data?.length ?? 0,
  };
  const stageTotal = stageCounts.draft + stageCounts.resting + stageCounts.approved;

  if (summaryQuery.isLoading) return (
    <Shell>
      <div className="space-y-7">
        <Skeleton className="h-32 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-80" />
      </div>
    </Shell>
  );
  if (summaryQuery.isError || !summary) return <Shell><ErrorState retry={() => summaryQuery.refetch()} /></Shell>;

  const metrics: Array<[string, number, LucideIcon, string, string]> = [
    ["Saved formulas", summary.formulaCount, BookOpen, "metric-0", "/formulas"],
    ["Material library", summary.materialCount, Leaf, "metric-1", "/materials"],
    ["Needs a second look", summary.reviewCount, ShieldCheck, "metric-2", "/formulas?status=resting"],
    ["Allergen notes", summary.allergenCount, CircleAlert, "metric-3", "/formulas"],
  ];

  return (
    <Shell>
      {/* ── HERO: greeting ────────────────────────────────── */}
      <QuickPrompt greeting={greeting} weekday={weekday} />

      {/* ── IDEA GENERATOR ────────────────────────────────── */}
      <FormulaIdeaGenerator onSelect={(n, b, mats) => {
        try { sessionStorage.setItem("matiere-blueprint", JSON.stringify(mats)); } catch {}
        setLocation(`/formulas/new?name=${encodeURIComponent(n)}&brief=${encodeURIComponent(b)}`);
      }} />

      {/* ── STAGE PIPELINE ────────────────────────────────── */}
      {stageTotal > 0 && <StageTrack counts={stageCounts} total={stageTotal} />}

      {/* ── ANIMATED METRICS ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-px bg-border border-b border-border lg:grid-cols-4">
        {metrics.map(([label, count, Icon, testId, href], i) => (
          <MetricCard key={label} label={label} value={count} Icon={Icon} delay={0.07 * i} testId={testId} href={href} />
        ))}
      </div>

      {/* ── MATERIALS SPOTLIGHT STRIP ─────────────────────── */}
      <motion.div
        className="border-b border-border overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between px-0 pt-5 pb-3">
          <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">Palette · seasonal</p>
        </div>
        <div className="flex gap-px overflow-x-auto">
          {[
            { src: `${import.meta.env.BASE_URL}images/spice.jpg`,     label: "Cardamom CO₂", pos: "center" },
            { src: `${import.meta.env.BASE_URL}images/jasmine.jpg`,  label: "Jasmine sambac", pos: "center" },
            { src: `${import.meta.env.BASE_URL}images/resin.jpg`,    label: "Labdanum abs.", pos: "center" },
            { src: `${import.meta.env.BASE_URL}images/leaves.jpg`,   label: "Vetiver roots", pos: "center top" },
          ].map(({ src, label, pos }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex-1 min-w-[120px] overflow-hidden"
              style={{ height: 120 }}
            >
              <img
                src={src}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-80"
                style={{ objectPosition: pos }}
              />
              <div className="absolute inset-0 bg-foreground/40" />
              <p className="absolute bottom-2 left-2 font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/80">{label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <SectionRule label="The notebook · recent" />

      {/* ── LATEST FORMULAS — full width ──────────────────── */}
      <motion.section
        className="border-b border-border py-7"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">The notebook, recently</p>
            <h2 className="mt-1 font-display text-3xl">Latest formulas</h2>
          </div>
          <motion.div whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Link href="/formulas" data-testid="link-view-all-formulas" className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-foreground hover:underline">
              View all <ArrowUpRight size={12} />
            </Link>
          </motion.div>
        </div>
        {summary.recentFormulas.length
          ? summary.recentFormulas.map(formula => <FormulaRow key={formula.id} formula={formula} />)
          : <EmptyState title="Your first formula is waiting." copy="Start with a feeling, a material, or a strange little question." href="/formulas/new" label="Open a fresh page" />}
      </motion.section>

      <SectionRule label="Source · supply" />

      {/* ── SHOP BANNER — muted lilac panel, echoing the landing sections ── */}
      <motion.div
        className="relative my-7 flex flex-col gap-4 overflow-hidden border border-accent/40 bg-accent px-6 py-7 text-accent-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/flower.jpg`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-6 top-1/2 hidden h-[150%] w-56 -translate-y-1/2 object-cover opacity-25 mix-blend-luminosity sm:block"
        />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-accent via-accent/95 to-transparent sm:block" />
        <div className="relative">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-accent-foreground/60">Supplier sourcing</p>
          <h2 className="mt-2 font-display text-3xl">Stock the palette.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-accent-foreground/70">Browse Fraterworks, PCW, and Contrebande — the three suppliers this studio tracks.</p>
        </div>
        <div className="relative shrink-0">
          <Button href="/shop" testId="button-dashboard-shop">Browse shop</Button>
        </div>
      </motion.div>

      {/* ── ACTIVITY FEED ─────────────────────────────────── */}
      {(activityQuery.data?.length ?? 0) > 0 && (
        <>
        <SectionRule label="Studio log · activity" />
        <div className="py-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Recent activity</p>
              <h2 className="mt-1 font-display text-3xl">Studio log</h2>
            </div>
          </div>
          <div className="border border-border">
            {activityQuery.data!.slice(0, 10).map((ev, i) => (
              <div
                key={ev.id}
                className={`grid grid-cols-[100px_1fr_auto] items-center gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
                  {new Date(ev.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <p className="text-xs text-foreground">{ev.summary}</p>
                <p className="font-mono-ui text-[8px] text-muted-foreground truncate max-w-[140px]">{ev.formulaName}</p>
              </div>
            ))}
          </div>
        </div>
        </>
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
            <Button href="/coach?attach=1" variant="outline" testId="button-library-analyze-file"><Paperclip size={13} /> Analyze a file</Button>
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
  const [expanded, setExpanded] = useState(false);
  const familyKey = normalizeMaterialFamilies(material.family)[0] ?? "";
  const wash = FAMILY_WASH[familyKey] ?? { bg: "bg-secondary", img: "botanicals.jpg", pos: "center" };
  return (
    <article className="group relative border border-border bg-card overflow-hidden p-5" data-testid={`card-material-${material.id}`}>
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
        <button onClick={() => setExpanded(!expanded)} data-testid={`button-material-details-${material.id}`} className="mt-4 flex w-full items-center justify-between text-left text-[11px] uppercase tracking-widest text-foreground">
          {expanded ? "Hide notes" : "Read usage notes"}
          <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground animate-fade-in">
            <p>{material.usageNotes}</p>
            {material.allergens.length > 0 && <p className="mt-2 text-destructive">Allergens to note: {material.allergens.join(", ")}</p>}
            <p className="mt-2 font-mono-ui text-[9px]">CAS {material.casNumber ?? "Not listed"}</p>
          </div>
        )}
      </div>
    </article>
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

  const add = () => setIngredients([...ingredients, { materialId: 0, materialName: "", percentage: 0, grams: 0, dilution: 100, role: "heart" }]);

  const update = (index: number, patch: Partial<FormulaIngredientInput>) => {
    setIngredients(ingredients.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      if ("grams" in patch) {
        // grams is the primary input — derive percentage from it
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
            const pctOfConc = Math.round(ingredient.percentage * concentration / 100 * 10) / 10;

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
                          <span title={`Contribution to finished ${concentration}% concentrate`}>{pctOfConc}% of conc.</span>
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
                className={`h-full ${totalPct > 100 ? "bg-destructive" : totalPct === 100 ? "bg-accent" : "bg-foreground"}`}
                animate={{ width: `${Math.min(totalPct, 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className={`font-mono-ui text-[10px] ${totalPct > 100 ? "text-destructive" : totalPct === 100 ? "text-accent-foreground" : "text-muted-foreground"}`}>
              {totalPct}% of formula
            </span>
          </div>
          {totalPct > 100 && <span className="font-mono-ui text-[9px] text-destructive">Exceeds 100%</span>}
          {totalPct === 100 && <span className="font-mono-ui text-[9px] text-accent-foreground">Palette complete</span>}
          {totalPct > 0 && totalPct < 100 && (
            <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round((100 - totalPct) * 10) / 10}% remaining</span>
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
                <span className="text-sm text-white/90">{mat.name}</span>
                <span className="font-mono-ui text-[8px] uppercase tracking-widest text-white/30">{meta.label}</span>
              </div>
              <span className="font-mono-ui text-[11px] tabular-nums text-white/50">{mat.pct}%</span>
            </div>
            <div className="h-[2px] w-full bg-white/10">
              <motion.div
                className={`h-full bg-white ${meta.barOpacity}`}
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
        className="mt-2 flex items-center justify-between border-t border-white/10 pt-3"
      >
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-white/30">Concentrate total</span>
        <span className="font-mono-ui text-[11px] tabular-nums text-white/50">
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
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col overflow-hidden bg-[#0C0C0C]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-[3px] w-10 bg-white/20" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
          {/* Eyebrow */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-white/50" />
              <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/50">Formula suggestion</p>
            </div>
            <button onClick={onClose} className="p-1 text-white/40 hover:text-white/80 transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl leading-[.92] text-white"
          >
            {idea.name}
          </motion.h2>

          {/* Brief */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className="mt-6 border-t border-white/10 pt-5"
          >
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/40 mb-2">The brief</p>
            <p className="text-base leading-7 text-white/85">{idea.brief}</p>
          </motion.div>

          {/* Direction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.13, duration: 0.3 }}
            className="mt-5 border-t border-white/10 pt-5"
          >
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/40 mb-2">Direction</p>
            <p className="text-sm leading-6 text-white/55">{idea.direction}</p>
          </motion.div>

          {/* Materials — fetched on open */}
          <div className="mt-6 border-t border-white/10 pt-5 pb-4">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-white/40 mb-5">Materials &amp; ratios</p>

            {loadingMats && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-3 bg-white/10 rounded-none" style={{ width: `${40 + i * 8}%` }} />
                      <div className="h-3 w-8 bg-white/10 rounded-none" />
                    </div>
                    <div className="h-[2px] w-full bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {!loadingMats && matsError && (
              <p className="text-xs text-white/40">Couldn't load materials. Try again.</p>
            )}

            {!loadingMats && !matsError && materials.length > 0 && (
              <MaterialBars materials={materials} />
            )}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="shrink-0 border-t border-white/10 bg-[#0C0C0C] px-6 py-5 sm:px-8">
          <button
            onClick={() => onStart(materials)}
            data-testid="button-idea-start"
            className="flex w-full items-center justify-center gap-2 bg-white py-4 font-mono-ui text-[11px] uppercase tracking-widest text-black transition-opacity hover:opacity-90 active:opacity-80"
          >
            Start this formula
            <ArrowRight size={13} />
          </button>
          <button
            onClick={onClose}
            className="mt-3 w-full py-2 font-mono-ui text-[9px] uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
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
        className="bg-[#000000] px-6 py-10 sm:px-10 sm:py-12"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <Sparkles size={15} className="text-white/70" />
          <p className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-white/70">Idea generator</p>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl text-white leading-[.9] mb-2">Not sure where to start?</h2>
        <p className="text-white/60 text-sm leading-6 mb-8">Describe a feeling, a material, a mood — or leave it blank and be surprised.</p>

        {/* Input */}
        <form onSubmit={generate}>
          <div className={`flex items-center bg-white/10 border transition-colors duration-200 ${focused ? "border-white/60" : "border-white/20"}`}>
            <input
              value={mood}
              onChange={e => setMood(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={typewriter}
              data-testid="input-idea-mood"
              className="min-w-0 flex-1 bg-transparent px-5 py-5 text-base text-white outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="button-generate-ideas"
              className="flex h-[60px] shrink-0 items-center gap-2 border-l border-white/20 bg-white px-5 font-mono-ui text-[10px] uppercase tracking-widest text-black transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {loading
                ? <span className="size-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                : <Sparkles size={13} />}
              {loading ? "Thinking…" : "Generate"}
            </button>
          </div>
          {error && <p className="mt-3 text-xs text-white/60" data-testid="status-idea-error">{error}</p>}
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
              <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-white/50 mb-3">Tap an idea to explore it</p>
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
                    className="group relative bg-white/10 border border-white/15 p-5 text-left transition-all hover:bg-white/20 hover:border-white/30 active:scale-[.98]"
                  >
                    <p className="font-display text-2xl leading-tight text-white pr-6">{idea.name}</p>
                    <p className="mt-2 text-xs leading-5 text-white/65 line-clamp-3">{idea.brief}</p>
                    {/* Arrow affordance */}
                    <ArrowRight size={13} className="absolute top-5 right-5 text-white/30 transition-all group-hover:text-white/70 group-hover:translate-x-0.5" />
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
      className="bg-foreground text-background p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Sparkles size={12} className="text-background/50" />
        <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-background/50">AI blueprint — materials &amp; ratios</p>
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
                  <span className="text-sm font-medium text-background/90">{mat.name}</span>
                  <span className="font-mono-ui text-[8px] uppercase tracking-widest text-background/35">{roleLabel}</span>
                </div>
                <span className="font-mono-ui text-[11px] tabular-nums text-background/50">{mat.pct}%</span>
              </div>
              <div className="h-[2px] w-full bg-background/15">
                <motion.div
                  className={`h-full bg-background ${barOpacity}`}
                  initial={{ width: 0 }}
                  animate={{ width: barWidth }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 border-t border-background/15 pt-3 flex items-center justify-between">
        <span className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-background/30">Concentrate total</span>
        <span className="font-mono-ui text-[11px] tabular-nums text-background/50">{sorted.reduce((s, m) => s + m.pct, 0)}%</span>
      </div>
      <p className="mt-3 text-[10px] text-background/35 leading-5">Add each material using the ingredient builder below. Match names to your library.</p>
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
          percentage: mat.pct,
          grams: parseFloat(((mat.pct / 100) * 30).toFixed(3)),
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
        setLocation(`/formulas/${formula.id}`);
      }}
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="New page · formula"
        title="Make a beginning."
        description="A formula is a hypothesis. Give it a clear brief, then let the materials answer back."
        action={<FormulaToolFileUpload testId="button-new-formula-upload-file" />}
      />
      <FormulaIdeaGenerator onSelect={(n, b, mats) => {
        setName(n);
        setBrief(b);
        const rawIngs: FormulaIngredientInput[] = mats.map(mat => ({
          materialId: 0,
          materialName: mat.name,
          percentage: mat.pct,
          grams: parseFloat(((mat.pct / 100) * totalMl).toFixed(3)),
          dilution: 100,
          role: mat.role,
        }));
        // Library is already fetched by this point — match immediately.
        // Also reset the guard so the useEffect won't re-run a stale match.
        blueprintMatchedRef.current = true;
        setIngredients(matchBlueprintToLibrary(rawIngs, libraryMaterials));
      }} />
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-5">
          <div className="border border-border bg-card p-6 sm:p-7">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p>
            <label className="mt-5 block text-xs font-medium">Name
              <input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" placeholder="A name with a little weather" />
            </label>
            <label className="mt-7 block text-xs font-medium">Creative brief <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-28 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="What should this scent make possible?" />
            </label>
            <div className="mt-7 grid grid-cols-2 gap-4">
              <label className="text-xs font-medium">Concentration %
                <input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
              <label className="text-xs font-medium">Batch size ml
                <input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
              </label>
            </div>
            <IfraCategoryPicker value={ifraCategory} onChange={setIfraCategory} testId="select-formula-ifra-category" />
            <label className="mt-7 block text-xs font-medium">Notebook notes
              <textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, things to remember..." />
            </label>
          </div>
        </div>
        <div className="space-y-5">
          <IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} totalMl={totalMl} concentration={concentration} />
          <div className="flex items-center justify-between border border-border bg-card p-5">
            <div>
              <p className="font-display text-2xl">Keep it open.</p>
              <p className="mt-1 text-xs text-muted-foreground">You can revise every field once it's in the library.</p>
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
  const params = useParams<{ id: string }>(); const id = Number(params.id);
  const query = useGetFormula(id, { query: { enabled: Number.isFinite(id), queryKey: getGetFormulaQueryKey(id) } });
  const update = useUpdateFormula(); const remove = useDeleteFormula(); const qc = useQueryClient(); const [, setLocation] = useLocation();
  const formula = query.data;
  const [editing, setEditing] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [name, setName] = useState(""); const [brief, setBrief] = useState(""); const [notes, setNotes] = useState(""); const [status, setStatus] = useState<"draft" | "resting" | "approved" | "archived">("draft");
  const [editConcentration, setEditConcentration] = useState(20); const [editTotalMl, setEditTotalMl] = useState(30);
  const [editIfraCategory, setEditIfraCategory] = useState("");
  const [editIngredients, setEditIngredients] = useState<FormulaIngredientInput[]>([]);
  const begin = () => {
    if (!formula) return;
    setName(formula.name); setBrief(formula.brief); setNotes(formula.notes ?? ""); setStatus(formula.status);
    setEditConcentration(formula.concentration); setEditTotalMl(formula.totalMl);
    setEditIfraCategory(formula.ifraCategory ?? "");
    setEditIngredients(formula.ingredients.map(i => ({ materialId: i.materialId, materialName: i.materialName, percentage: i.percentage, grams: i.grams, dilution: i.dilution ?? 100, role: i.role as FormulaIngredientInput["role"], allergenFlags: i.allergenFlags ?? [] })));
    setEditing(true);
  };
  const save = () => update.mutate({ id, data: { name, brief, notes, status, concentration: editConcentration, totalMl: editTotalMl, ifraCategory: editIfraCategory || undefined, ingredients: editIngredients } }, { onSuccess: result => { qc.setQueryData(getGetFormulaQueryKey(id), result); qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setEditing(false); } });
  const destroy = () => { if (window.confirm("Delete this formula from the library?")) remove.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setLocation("/formulas"); } }); };
  const eventsQuery = useGetFormulaEvents(id, { query: { queryKey: getGetFormulaEventsQueryKey(id), enabled: Number.isFinite(id) } });
  const events = eventsQuery.data ?? [];
  if (query.isLoading) return <Shell><Skeleton className="h-72" /></Shell>;
  if (query.isError || !formula) return <Shell><ErrorState retry={() => query.refetch()} /></Shell>;
  return (
    <Shell><PageHeader eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · version ${formula.version}`} title={formula.name} description={formula.brief} action={<div className="flex flex-wrap gap-2"><FormulaToolFileUpload testId="button-formula-upload-file" /><Button href={`/coach?formula=${formula.id}`} variant="outline" testId="button-discuss-lab">Discuss in lab ↗</Button><Button onClick={begin} variant="outline" testId="button-edit-formula">Edit</Button><Button onClick={destroy} variant="quiet" testId="button-delete-formula">Delete</Button></div>} /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="space-y-6"><div className="border border-border bg-card p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula status</p><div className="mt-3 flex items-center gap-3"><StatusPill value={formula.status} /><StatusPill value={formula.safetyStatus} /><StatusPill value={formula.ifraStatus} /></div></div><div className="text-right"><p className="font-display text-4xl">{formula.concentration}%</p><p className="font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p></div></div></div><div className="border border-border bg-card p-6 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The structure</p><h2 className="mt-1 font-display text-3xl">Ingredient map</h2></div><div className="flex items-center gap-3 pt-1"><p className="font-mono-ui text-[10px] text-muted-foreground">{formula.ingredients.length} materials</p><button onClick={begin} data-testid="button-edit-inline" className="border border-border bg-secondary/60 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest text-foreground transition-colors hover:bg-secondary">Edit</button></div></div><div className="mt-5 space-y-1">{(() => { const unlinkCount = formula.ingredients.filter(i => i.materialId === 0).length; return unlinkCount > 0 ? (<div className="mb-4 flex items-start gap-2.5 border border-accent/30 bg-accent/10 px-4 py-3" data-testid="banner-unlinked-ingredients"><CircleAlert size={13} className="mt-0.5 shrink-0 text-accent-foreground/70" /><p className="font-mono-ui text-[10px] uppercase tracking-[.1em] leading-5 text-accent-foreground/70">{unlinkCount} ingredient{unlinkCount > 1 ? "s" : ""} not yet linked to your library — open Edit to resolve</p></div>) : null; })()}{formula.ingredients.map((item, i) => { const unlinked = item.materialId === 0; return (<div key={`${item.materialId}-${i}`} data-testid={`row-ingredient-${item.materialId}`} className={`grid grid-cols-[1fr_70px_70px] items-center gap-3 border-t py-4 ${unlinked ? "border-accent/30" : "border-border"}`}><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{item.materialName}</p>{unlinked && <span className="inline-flex items-center border border-accent/40 px-1.5 py-0.5 font-mono-ui text-[8px] uppercase tracking-widest text-accent-foreground/70" data-testid={`badge-unlinked-${i}`}>Unlinked</span>}</div><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{item.role}</p></div><p className="text-right font-mono-ui text-xs">{item.percentage}%</p><p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p></div>); })}</div></div>{editing && (
                                                                                                          <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
                                                                                                            <div className="mx-auto max-w-5xl px-5 pb-20 pt-6 sm:px-10">
                                                                                                              <div className="mb-8 flex items-center justify-between">
                                                                                                                <div>
                                                                                                                  <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Editing · formula {String(formula.id).padStart(3, "0")}</p>
                                                                                                                  <h2 className="mt-1 font-display text-4xl">Stay curious.</h2>
                                                                                                                </div>
                                                                                                                <button onClick={() => setEditing(false)} data-testid="button-close-edit" className="grid size-9 place-items-center border border-border bg-card hover:bg-secondary"><X size={16} /></button>
                                                                                                              </div>
                                                                                                              <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
                                                                                                                <div className="space-y-5">
                                                                                                                  <div className="border border-border bg-card p-6 sm:p-7">
                                                                                                                    <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p>
                                                                                                                    <div className="mt-5 grid grid-cols-2 gap-4">
                                                                                                                      <label className="text-xs font-medium">Concentration %
                                                                                                                        <input type="number" min="0" max="100" value={editConcentration} onChange={e => setEditConcentration(Number(e.target.value))} data-testid="input-edit-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                                                                                                                      </label>
                                                                                                                      <label className="text-xs font-medium">Batch size ml
                                                                                                                        <input type="number" min="0" value={editTotalMl} onChange={e => setEditTotalMl(Number(e.target.value))} data-testid="input-edit-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" />
                                                                                                                      </label>
                                                                                                                    </div>
                                                                                                                    <label className="mt-7 block text-xs font-medium">Stage
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
                                                                                                                      <p className="mt-1 text-xs text-muted-foreground">All changes replace the current version.</p>
                                                                                                                    </div>
                                                                                                                    <div className="flex gap-2">
                                                                                                                      <Button onClick={() => setEditing(false)} variant="quiet" testId="button-cancel-edit">Cancel</Button>
                                                                                                                      <Button onClick={save} disabled={update.isPending || !name} testId="button-update-formula">{update.isPending ? "Saving…" : "Save changes"}</Button>
                                                                                                                    </div>
                                                                                                                  </div>
                                                                                                                  {update.isError && <p className="text-sm text-destructive" data-testid="status-update-error">Couldn't save. Try again.</p>}
                                                                                                                </div>
                                                                                                              </div>
                                                                                                            </div>
                                                                                                          </div>
                                                                                                        )}</section><aside className="space-y-6"><button onClick={() => setSafetyOpen(v => !v)} className="w-full text-left border border-border bg-secondary p-6 text-foreground transition-colors hover:bg-secondary/80 active:bg-secondary/60">
                                                                                              <div className="flex items-start justify-between gap-3">
                                                                                                <ShieldCheck size={20} className="text-muted-foreground mt-0.5 shrink-0" />
                                                                                                <ChevronDown size={16} className={`mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 ${safetyOpen ? "rotate-180" : ""}`} />
                                                                                              </div>
                                                                                              <p className="mt-4 font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula safety</p>
                                                                                              <p className="mt-2 font-display text-3xl leading-tight">Allergens &amp; IFRA compliance</p>
                                                                                              <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                                                                                                {formula.ifraCategory
                                                                                                  ? <div className="flex justify-between gap-2"><span className="shrink-0 text-muted-foreground">Product category</span><span className="text-right">{IFRA_CATEGORIES.find(c => c.value === formula.ifraCategory)?.label ?? `Cat ${formula.ifraCategory}`}</span></div>
                                                                                                  : <div className="flex justify-between gap-2"><span className="shrink-0 text-muted-foreground">Product category</span><span className="italic text-muted-foreground">Not set</span></div>
                                                                                                }
                                                                                                <div className="flex justify-between"><span className="text-muted-foreground">Allergen notes</span><span data-testid="text-formula-allergens">{formula.allergenCount}</span></div>
                                                                                                <div className="flex justify-between"><span className="text-muted-foreground">IFRA status</span><span>{formula.ifraStatus.replace(/_/g, " ")}</span></div>
                                                                                                <div className="flex justify-between"><span className="text-muted-foreground">Last touched</span><span>{new Date(formula.updatedAt).toLocaleDateString()}</span></div>
                                                                                              </div>
                                                                                              <AnimatePresence>
                                                                                                {safetyOpen && (
                                                                                                  <motion.div
                                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                                    animate={{ opacity: 1, height: "auto" }}
                                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                                                                                                    className="overflow-hidden"
                                                                                                  >
                                                                                                    <div className="mt-4 border-t border-border pt-4 space-y-3">
                                                                                                      {formula.ingredients.filter(i => (i.allergenFlags ?? []).length > 0).length === 0 ? (
                                                                                                        <p className="text-xs text-muted-foreground">No allergen flags on any ingredient.</p>
                                                                                                      ) : (
                                                                                                        formula.ingredients
                                                                                                          .filter(i => (i.allergenFlags ?? []).length > 0)
                                                                                                          .map((item, i) => (
                                                                                                            <div key={i} className="text-xs">
                                                                                                              <p className="font-medium">{item.materialName}</p>
                                                                                                              <p className="mt-0.5 text-muted-foreground">{(item.allergenFlags ?? []).join(", ")}</p>
                                                                                                            </div>
                                                                                                          ))
                                                                                                      )}
                                                                                                    </div>
                                                                                                  </motion.div>
                                                                                                )}
                                                                                              </AnimatePresence>
                                                                                            </button><div className="border border-border bg-card p-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Notebook</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground" data-testid="text-formula-notes">{formula.notes || "No notes yet. Leave a trace for the next session."}</p></div><div className="border border-border bg-card p-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Studio</p><h3 className="mt-3 font-display text-2xl leading-none">Take it to the lab.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Open this formula in the Creative Lab — the coach will know exactly what you're working on.</p><div className="mt-5 space-y-2"><Button href={`/coach?formula=${formula.id}`} testId="button-formula-to-lab">Open in Creative Lab</Button><Button onClick={begin} variant="outline" testId="button-formula-edit-studio">Edit formula</Button></div></div>
                                                                                            {events.length > 0 && (
                                                                                              <div className="border border-border bg-card p-6">
                                                                                                <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Change log</p>
                                                                                                <div className="mt-4 space-y-0">
                                                                                                  {events.slice(0, 8).map((ev, i) => (
                                                                                                    <div key={ev.id} className={`flex items-start gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                                                                                                      <div className="mt-0.5 font-mono-ui text-[8px] text-muted-foreground shrink-0 w-16">{new Date(ev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                                                                                      <p className="text-xs leading-5 text-muted-foreground">{ev.summary}</p>
                                                                                                    </div>
                                                                                                  ))}
                                                                                                </div>
                                                                                              </div>
                                                                                            )}
                                                                                            </aside></div></Shell>
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#ffffffd9] via-[#ffffff55] to-transparent" />
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ffffffb8] to-transparent" />

              {/* Field note header */}
              <div className="relative flex justify-between px-8 pt-8 font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#3a3a3f]">
                <span>Field note {scene.fieldNote}</span><span>{scene.date}</span>
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-10 left-8 right-8 z-[1]">
                <p className="font-display text-6xl leading-[.82] text-[#423838]">
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

function Landing() {
  const { scrollY } = useScroll();
  // Scroll-zoom: hero text grows as user scrolls down (cinematic push-in)
  const heroScale = useTransform(scrollY, [0, 700], [1, 1.13]);
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const heroY = useTransform(scrollY, [0, 700], [0, 110]);
  // Card drifts upward at a different rate — creates depth separation
  const cardY = useTransform(scrollY, [0, 700], [0, -70]);
  const smoothCardY = useSpring(cardY, { damping: 16, stiffness: 80 });
  // Parallax image strip — three planes at independent scroll speeds
  const para1Y = useTransform(scrollY, [300, 1400], [40, -120]);
  const para2Y = useTransform(scrollY, [300, 1400], [10,  -60]);
  const para3Y = useTransform(scrollY, [300, 1400], [80, -160]);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#000000]">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-10"
      >
        <Logo />
        <div className="flex items-center gap-2">
          <Button href="/sign-in" variant="quiet" testId="link-landing-sign-in">Sign in</Button>
          <Button href="/sign-up" testId="link-landing-sign-up">Open the lab</Button>
        </div>
      </motion.header>
      <main className="text-[#ffffff] bg-[#ffffffe0]">
        {/* Hero — scroll zoom layer */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 overflow-visible px-5 pb-20 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-32 pl-[0px]">
          <motion.div
            style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
            className="origin-bottom-left"
          >
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-[#080000]"
            >
              A creative perfumery workspace
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 36, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl font-display tracking-[-.045em] text-[69px] text-[#000000] mb-0 mt-[5px] pt-[0px] pb-[0px]"
            >
              Where instinct meets <em className="text-[#000000] ml-[1px] mr-[1px] pt-[0px] pb-[0px] mt-[50px] mb-[50px]">precision.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 max-w-lg text-[28px] text-left border-t-[#a62d2d] border-r-[#a62d2d] border-b-[#a62d2d] border-l-[#a62d2d] text-[#000000]"
            >
              Matière is a focused studio for independent perfumers: keep the instinct, keep the record, keep formula safety close enough to trust.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.55 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button href="/sign-up" testId="button-landing-start">Start making</Button>
              <span className="ml-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">No blank canvases required.</span>
            </motion.div>
          </motion.div>

          {/* Parallax card — drifts at independent scroll speed */}
          <motion.div style={{ y: smoothCardY }}>
            <FieldNoteCard />
          </motion.div>
        </section>

        {/* Parallax image strip — three planes at independent depths */}
        <section className="relative overflow-hidden bg-[#080808]" style={{ height: "65vh", minHeight: 420 }}>
          {/* Plane 1 — leftmost, slowest */}
          <motion.div style={{ y: para1Y }} className="absolute left-0 top-0 h-[110%] w-[42%]">
            <img src={`${import.meta.env.BASE_URL}images/hero-droplets.jpg`} alt="" aria-hidden className="h-full w-full object-cover opacity-70" style={{ objectPosition: "center" }} />
          </motion.div>
          {/* Plane 2 — centre, mid-speed */}
          <motion.div style={{ y: para2Y }} className="absolute left-[39%] top-[8%] h-[95%] w-[30%]">
            <img src={`${import.meta.env.BASE_URL}images/flower.jpg`} alt="" aria-hidden className="h-full w-full object-cover opacity-65" style={{ objectPosition: "center top" }} />
          </motion.div>
          {/* Plane 3 — rightmost, fastest */}
          <motion.div style={{ y: para3Y }} className="absolute right-0 top-[-8%] h-[120%] w-[29%]">
            <img src={`${import.meta.env.BASE_URL}images/spice.jpg`} alt="" aria-hidden className="h-full w-full object-cover opacity-60" style={{ objectPosition: "center" }} />
          </motion.div>
          {/* Depth gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080808]/70 via-transparent to-[#080808]/70" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080808]/50 via-transparent to-[#080808]/50" />
          {/* Floating label */}
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono-ui text-[8px] uppercase tracking-[.28em] text-white/30">The palette · raw materials</p>
        </section>

        {/* 01 / 02 / 03 — editorial row layout on dark */}
        <section className="bg-[#0c0c0c]">
          <div className="mx-auto max-w-7xl">
            {[
              {
                num: "01",
                label: "Capture",
                title: "Every instinct, on record.",
                copy: "The brief that usually lives in your head — the mood, the reference, the strange thing you smelled on a Tuesday — has a place. Write it before the formula starts behaving.",
                tag: "Brief → Formula",
                img: null,
              },
              {
                num: "02",
                label: "Build",
                title: "A library that works the way you think.",
                copy: "Search by family, odour profile, or supplier. IFRA limits and allergen flags surface the moment you're making a decision — not buried somewhere else.",
                tag: "Materials → Safety",
                img: null,
              },
              {
                num: "03",
                label: "Refine",
                title: "The record is the whole process.",
                copy: "Every version is saved. Every note stays next to the work. The formula that finally clicked — and the seven that didn't — are all still there, waiting.",
                tag: "Iteration → Archive",
                img: `${import.meta.env.BASE_URL}images/aura.jpg`,
              },
            ].map(({ num, label, title, copy, tag, img }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`grid items-center gap-6 border-b border-white/[0.07] px-5 py-12 sm:px-10 sm:py-14 ${img ? "lg:grid-cols-[140px_1fr_320px]" : "lg:grid-cols-[140px_1fr_200px]"}`}
              >
                {/* Decorative number */}
                <div className="font-display text-[96px] leading-none lg:text-[120px] bg-[#e5d5d500] text-[#ffffffb8]">{num}</div>
                {/* Content */}
                <div>
                  <p className="font-mono-ui text-[9px] uppercase tracking-[.26em] text-[#B0AAB8]">{num} / {label}</p>
                  <h2 className="mt-3 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] text-white">{title}</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-[1.75] text-white/45">{copy}</p>
                </div>
                {/* Right column — image or tag */}
                {img ? (
                  <div className="hidden h-48 overflow-hidden lg:block">
                    <img
                      src={img}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover opacity-80"
                    />
                  </div>
                ) : (
                  <p className="hidden font-mono-ui text-[8px] uppercase tracking-[.2em] text-white/20 lg:block lg:text-right">{tag}</p>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Precision — two-column: photo left, features right */}
        <section className="mx-auto max-w-7xl border-t border-border px-5 py-24 sm:px-10">
          <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.5fr]">

            {/* Left — eyebrow, heading, photo */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-7"
            >
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">A studio practice</p>
                <h2 className="mt-5 font-display text-5xl leading-[.9]">Precision can feel personal.</h2>
              </div>
              <div className="overflow-hidden border border-border">
                <img
                  src={`${import.meta.env.BASE_URL}images/studio-practice.jpg`}
                  alt="Perfumer's studio with curved shelves of fragrance materials"
                  data-testid="img-precision-flower"
                  className="w-full"
                />
              </div>
            </motion.div>

            {/* Right — 2×3 feature grid */}
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {[
                { index: "01", title: "Formula builder",     copy: "Add materials by role — top, heart, base — with live percentage and gram weights as you go." },
                { index: "02", title: "Safety in the margin", copy: "Allergen flags and IFRA limits surface at the exact moment a choice is made, not after." },
                { index: "03", title: "AI idea generator",   copy: "Describe a brief in plain language. Get a material blueprint with role assignments to build from." },
                { index: "04", title: "Material library",    copy: "Your ingredient collection, browsable by olfactive family. Every material links to the formulas that use it." },
                { index: "05", title: "Creative lab",        copy: "Persistent AI coaching sessions — pick up a thread on longevity, accord balance, or what to try next." },
                { index: "06", title: "Formula history",     copy: "A full changelog of every edit. Go back to any state, or use history to understand what changed and why." },
              ].map(({ index, title, copy }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="border-l border-border pl-5"
                >
                  <span className="font-mono-ui text-[8px] text-muted-foreground/40">{index}</span>
                  <p className="mt-1 font-medium text-[28px]">{title}</p>
                  <p className="mt-2 text-muted-foreground text-[17px]">{copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact sheet — full-bleed horizontal image strip */}
        <section className="border-t border-white/10 bg-[#000000]">
          <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
            {[
              { src: `${import.meta.env.BASE_URL}images/botanicals.jpg`, caption: "Dried botanicals",    pos: "center top" },
              { src: `${import.meta.env.BASE_URL}images/resin.jpg`,    caption: "Labdanum resin",      pos: "center" },
              { src: `${import.meta.env.BASE_URL}images/jasmine.jpg`,  caption: "Jasmine sambac",      pos: "center" },
              { src: `${import.meta.env.BASE_URL}images/spice.jpg`,    caption: "Cardamom / pepper",   pos: "center" },
            ].map(({ src, caption, pos }, i) => (
              <motion.div
                key={caption}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8 }}
                className="overflow-hidden"
              >
                <div className="relative overflow-hidden" style={{ height: "280px" }}>
                  <img
                    src={src}
                    alt={caption}
                    className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
                    style={{ objectPosition: pos }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <p className="absolute bottom-4 left-4 font-mono-ui text-[9px] uppercase tracking-[.2em] text-white/40">{caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Manifesto — black section with large display type and decorative rules */}
        <section className="bg-[#000000] px-5 py-24 sm:px-10">
          <div className="mx-auto max-w-4xl">
            {/* Top decorative rule */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-12 flex items-center gap-4 origin-left"
            >
              <div className="h-px flex-1 bg-white/20" />
              <span className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-white/30">Studio principle</span>
              <div className="h-px flex-1 bg-white/20" />
            </motion.div>

            <motion.blockquote
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-display tracking-[-0.035em] text-white text-[70px]"
            >
              The beginning of every formula.<br />
              <em className="text-[#B0AAB8] ml-[119px] mr-[119px]">The future of every idea.</em>
            </motion.blockquote>

            {/* Bottom decorative rule with diamond */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 flex items-center gap-4"
            >
              <div className="h-px flex-1 bg-white/20" />
              <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-white/20" fill="currentColor">
                <polygon points="5,0 10,5 5,10 0,5" />
              </svg>
              <div className="h-px flex-1 bg-white/20" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 max-w-lg text-sm leading-7 text-white/50"
            >Built for the independent perfumers who works seriously. Every formula stays in the notebook. Every limit stays in the margin.</motion.p>
          </div>
        </section>

        {/* Material showcase row — static, decorative */}
        <section className="border-t border-white/10 bg-[#000000] px-5 py-20 sm:px-10">
          <div className="mx-auto max-w-7xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-10 font-mono-ui text-[9px] uppercase tracking-[.3em] text-white/40"
            >
              The palette · key materials
            </motion.p>
            <div className="grid gap-px sm:grid-cols-3">
              {[
                { name: "Cardamom CO₂", family: "Spicy / Aromatic", origin: "Guatemala", ifra: "3.0%", img: "spice.jpg", pos: "center", note: "Eucalyptic and warm, with a cold green facet. Bridges green top notes into a spicy heart." },
                { name: "Rose Absolute", family: "Floral", origin: "Bulgaria / Turkey", ifra: "12.0%", img: "rose.jpg", pos: "center", note: "The most complex natural in the palette. Honey, geraniol, damascenone. Nothing replaces it." },
                { name: "Labdanum Abs.", family: "Resinous / Animalic", origin: "Spain / Greece", ifra: "6.0%", img: "resin.jpg", pos: "center", note: "Warm, leathery, animalic. The backbone of the chypre family. Irreplaceable as a fixative." },
              ].map(({ name, family, origin, ifra, img, pos, note }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.65, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden border border-white/10"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={`${import.meta.env.BASE_URL}images/${img}`}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full object-cover opacity-40"
                      style={{ objectPosition: pos }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#000000] opacity-[0]" />
                  </div>
                  <div className="border-t border-white/10 p-5">
                    <h3 className="font-display text-3xl text-white">{name}</h3>
                    <p className="mt-2 font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/40">{family} · {origin}</p>
                    <p className="mt-3 text-xs leading-5 text-white/55">{note}</p>
                    <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                      <span className="font-mono-ui text-[8px] uppercase tracking-[.18em] text-white/30">IFRA limit</span>
                      <span className="font-mono-ui text-[9px] text-white/60">{ifra}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-5 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] text-muted-foreground">
          <span className="font-mono-ui uppercase tracking-[.14em]">Matière · for independent noses</span>
          <span>Made for the long drydown.</span>
        </div>
      </footer>
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-background"><Skeleton className="h-8 w-32" /></div>;
  return isSignedIn ? <>{children}</> : <Redirect to="/sign-in" />;
}

function AuthPage({ kind }: { kind: "in" | "up" }) {
  return <div className="grid min-h-[100dvh] place-items-center px-4 py-10 bg-[#ffffff]"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><Logo /></div><div className="relative z-10 w-full max-w-[440px] border border-border bg-card p-2 shadow-2xl">{kind === "in" ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/dashboard`} />}</div></div>;
}

function NotFoundView() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Page not found · 404</p><h1 className="mt-4 font-display text-6xl">A missing page.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This page drifted out of the notebook. The rest of the studio is still here.</p><div className="mt-7"><Button href="/" testId="button-return-home">Return to the desk</Button></div></div></div>;
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: "hsl(0 0% 7%)", colorForeground: "hsl(0 0% 7%)", colorMutedForeground: "hsl(0 0% 45%)", colorBackground: "hsl(0 0% 100%)", colorInput: "hsl(0 0% 94%)", colorInputForeground: "hsl(0 0% 7%)", colorDanger: "hsl(0 58% 48%)", colorNeutral: "hsl(0 0% 86%)", fontFamily: "Inter", borderRadius: "0rem" }, elements: { cardBox: "bg-card border border-border w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-foreground font-medium", headerSubtitle: "text-muted-foreground", formFieldLabel: "text-foreground", formFieldInput: "bg-secondary text-foreground border border-border", formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-80 rounded-none uppercase tracking-widest text-[11px]", footerActionLink: "text-foreground underline", socialButtonsBlockButtonText: "text-foreground", socialButtonsBlockButton__google: "!hidden", dividerRow: "!hidden", dividerText: "text-muted-foreground", footerActionText: "text-muted-foreground" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Switch><Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} /><Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} /><Route path="/"><HomeRedirect /></Route><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/formulas/new"><Protected><NewFormula /></Protected></Route><Route path="/formulas/:id"><Protected><FormulaDetail /></Protected></Route><Route path="/formulas"><Protected><Formulas /></Protected></Route><Route path="/materials"><Protected><Materials /></Protected></Route><Route path="/files"><Protected><FileDrawer /></Protected></Route><Route path="/coach"><Protected><Coach /></Protected></Route><Route path="/shop"><Protected><Shop /></Protected></Route><Route><NotFoundView /></Route></Switch></WouterRouter></QueryClientProvider>
  </ClerkProvider>;
}

function HomeRedirect() {
  return <Landing />;
}
