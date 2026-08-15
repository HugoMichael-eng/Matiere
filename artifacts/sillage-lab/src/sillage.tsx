import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight, Beaker, BookOpen, ChevronDown, ChevronRight, CircleAlert,
  FlaskConical, Gauge, Leaf, LogOut, Menu, MessageCircle, Minus, Plus,
  Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, X, ShoppingBag
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
  if (href) return <Link href={href} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[.12em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-80 bg-[#57a1d4] border-t-[#140f0b05] border-r-[#140f0b05] border-b-[#140f0b05] border-l-[#140f0b05] text-white" data-testid={testId}>{children}</Link>;
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
function ErrorState({ retry }: { retry: () => void }) { return <div className="border border-destructive/30 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-3 font-display text-2xl">The studio is quiet.</p><p className="mt-1 text-sm text-muted-foreground">We couldn’t read your workspace just now.</p><div className="mt-4"><Button onClick={retry} variant="outline" testId="button-retry">Try again</Button></div></div>; }

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
  const [message, setMessage] = useState("");
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const createConv = useCreateConversation();
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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const title = message.trim().slice(0, 60);
    const pendingMessage = message;
    setMessage("");
    createConv.mutate(
      { data: { title } },
      {
        onSuccess: (conv) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setLocation(`/coach?conv=${conv.id}&autoSend=${encodeURIComponent(pendingMessage)}`);
        },
      },
    );
  };

  const isPending = createConv.isPending;

  return (
    <div
      ref={heroRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      className="relative overflow-hidden border-b border-border bg-foreground -mx-5 sm:-mx-8 lg:-mx-12"
      style={{ minHeight: "clamp(420px, 55vw, 600px)" }}
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

      {/* Gradient vignette — darker bottom so text reads cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Left vignette for breathing room on wide screens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 50%)",
        }}
      />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-between px-5 py-8 sm:px-8 sm:py-10 lg:px-12">

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

        {/* Greeting — editorial scale */}
        <div className="mt-auto">
          <motion.h1
            data-testid={`heading-${`${greeting}, maker.`.toLowerCase().replaceAll(" ", "-")}`}
            className="font-display leading-[.85] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(3.2rem, 9vw, 8rem)" }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          >
            {greeting},
            <br />
            maker.
          </motion.h1>

          {/* QuickPrompt card — sits as a distinct layer at the bottom of the hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 border border-white/10 bg-white/[0.06] backdrop-blur-sm"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.35)" }}
          >
            {/* Prompt header */}
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-white/40">Creative lab</p>
              <h2 className="mt-1.5 font-display text-xl leading-tight text-white sm:text-2xl">
                What are you working on?
              </h2>
            </div>

            {/* Input row */}
            <form onSubmit={submit} className="flex items-stretch">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={isPending}
                data-testid="input-quick-prompt"
                className="min-w-0 flex-1 bg-transparent px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
                placeholder="I'm trying to make something that feels like…"
              />
              <button
                type="submit"
                disabled={isPending || !message.trim()}
                data-testid="button-quick-prompt-send"
                className="grid h-[52px] w-14 shrink-0 place-items-center bg-white text-foreground transition-opacity disabled:opacity-30 hover:opacity-90"
              >
                {isPending
                  ? <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  : <Send size={15} />}
              </button>
            </form>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3 sm:px-6">
              {["How do I make a clean musk less obvious?", "The opening is too linear.", "I want warmth without sweetness."].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setMessage(prompt)}
                  className="border border-white/15 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-wider text-white/40 transition-colors hover:border-white/35 hover:text-white/70"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
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
      {/* ── HERO: greeting + quick prompt merged ──────────── */}
      <QuickPrompt greeting={greeting} weekday={weekday} />

      {/* ── IDEA GENERATOR ────────────────────────────────── */}
      <FormulaIdeaGenerator onSelect={(n, b) => setLocation(`/formulas/new?name=${encodeURIComponent(n)}&brief=${encodeURIComponent(b)}`)} />

      {/* ── STAGE PIPELINE ────────────────────────────────── */}
      {stageTotal > 0 && <StageTrack counts={stageCounts} total={stageTotal} />}

      {/* ── ANIMATED METRICS ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-px bg-border border-b border-border lg:grid-cols-4">
        {metrics.map(([label, count, Icon, testId, href], i) => (
          <MetricCard key={label} label={label} value={count} Icon={Icon} delay={0.07 * i} testId={testId} href={href} />
        ))}
      </div>

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
  return <Shell><PageHeader eyebrow="Library · formulas" title="Formula library" description="The living record of what you’ve made, paused, and almost made." action={<Button href="/formulas/new" testId="button-library-new">New formula</Button>} />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or brief..." data-testid="input-formula-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-foreground/40" /></div><select value={status} data-testid="select-formula-status" className="border border-border bg-card px-4 py-3 text-xs outline-none focus:border-foreground/40" onChange={e => setStatus(e.target.value as typeof status)}><option value="all">All stages</option><option value="draft">Drafts</option><option value="resting">Resting</option><option value="approved">Approved</option></select></div>
    <div className="border border-border bg-card px-5 sm:px-7"><div className="hidden grid-cols-[1.5fr_1fr_110px_110px_24px] gap-4 border-b border-border py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground sm:grid"><span>Formula</span><span>Palette</span><span>Stage</span><span className="text-right">Changed</span><span /></div>{query.isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="my-5 h-14" />) : query.isError ? <ErrorState retry={() => query.refetch()} /> : formulas.length ? formulas.map(formula => <FormulaRow key={formula.id} formula={formula} />) : <EmptyState title="No formulas found." copy="Try another search, or give the next one a name." href="/formulas/new" label="Start a formula" />}</div>
  </Shell>;
}

function Materials() {
  const [search, setSearch] = useState("");
  const query = useListMaterials({ search: search || undefined });
  const materials = query.data ?? [];
  return <Shell><PageHeader eyebrow="Library · raw materials" title="Materials" description="A tactile index of the things that make a formula feel alive." />
    <div className="mb-6 flex items-center gap-3"><div className="relative max-w-md flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials, families, origins..." data-testid="input-material-search" className="w-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-foreground/40" /></div><span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:block" data-testid="text-material-count">{materials.length} indexed</span></div>
    {query.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56" />)}</div> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{materials.map(material => <MaterialCard key={material.id} material={material} />)}{!materials.length && <div className="col-span-full"><EmptyState title="No materials in that drawer." copy="Try a different search term." href="/materials" label="Clear search" /></div>}</div>}
  </Shell>;
}

function MaterialCard({ material }: { material: Material }) {
  const [expanded, setExpanded] = useState(false);
  return <article className="group border border-border bg-card p-5" data-testid={`card-material-${material.id}`}><div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center bg-secondary text-foreground"><Leaf size={18} strokeWidth={1.5} /></div><StatusPill value={material.safetyStatus} /></div><h3 className="mt-5 font-display text-2xl leading-none" data-testid={`text-material-name-${material.id}`}>{material.name}</h3><p className="mt-2 text-xs text-muted-foreground">{material.family} · {material.origin}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-ui text-[9px] uppercase tracking-[.11em] text-muted-foreground"><span>IFRA {material.ifraLimit}%</span><span>{material.inStock ? "In stock" : "To source"}</span></div><button onClick={() => setExpanded(!expanded)} data-testid={`button-material-details-${material.id}`} className="mt-4 flex w-full items-center justify-between text-left text-[11px] uppercase tracking-widest text-foreground">{expanded ? "Hide notes" : "Read usage notes"}<ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground animate-fade-in"><p>{material.usageNotes}</p>{material.allergens.length > 0 && <p className="mt-2 text-destructive">Allergens to note: {material.allergens.join(", ")}</p>}<p className="mt-2 font-mono-ui text-[9px]">CAS {material.casNumber ?? "Not listed"}</p></div>}</article>;
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

  const selectedName = value.materialId ? value.materialName : "";

  return (
    <div ref={ref} className="relative min-w-0">
      <div className="flex items-center border border-border bg-card">
        <Search size={12} className="ml-3 shrink-0 text-muted-foreground" />
        <input
          type="text"
          data-testid={`select-ingredient-material-${index}`}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-muted-foreground/50"
          placeholder="Search material…"
          value={open ? query : selectedName}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {value.materialId > 0 && !open && (
          <span className="mr-2 shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground/60">
            {materials.find(m => m.id === value.materialId)?.family ?? ""}
          </span>
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

function FormulaIdeaGenerator({ onSelect }: { onSelect: (name: string, brief: string) => void }) {
  const { getToken } = useAuth();
  const [mood, setMood] = useState("");
  const [ideas, setIdeas] = useState<FormulaIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const typewriter = useTypewriter(IDEA_PROMPTS);

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#2563eb] px-6 py-10 sm:px-10 sm:py-12"
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
            className="flex h-[60px] shrink-0 items-center gap-2 border-l border-white/20 bg-white px-5 font-mono-ui text-[10px] uppercase tracking-widest text-[#2563eb] transition-opacity disabled:opacity-50 hover:opacity-90"
          >
            {loading
              ? <span className="size-3.5 animate-spin rounded-full border-2 border-[#2563eb]/30 border-t-[#2563eb]" />
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
            <p className="font-mono-ui text-[8px] uppercase tracking-[.22em] text-white/50 mb-3">Click an idea to use it</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {ideas.map((idea, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => onSelect(idea.name, idea.brief)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.09, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  data-testid={`button-idea-${i}`}
                  className="group bg-white/10 border border-white/15 p-5 text-left transition-all hover:bg-white/20 hover:border-white/30"
                >
                  <p className="font-display text-2xl leading-tight text-white">{idea.name}</p>
                  <p className="mt-2 text-xs leading-5 text-white/65">{idea.brief}</p>
                  <p className="mt-3 font-mono-ui text-[8px] uppercase tracking-widest text-white/35 group-hover:text-white/55 transition-colors">{idea.direction}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function NewFormula() {
  const [, setLocation] = useLocation();
  const rawSearch = useSearch();
  const params = new URLSearchParams(rawSearch);
  const create = useCreateFormula();
  const qc = useQueryClient();
  const [name, setName] = useState(params.get("name") ?? ""); const [brief, setBrief] = useState(params.get("brief") ?? ""); const [concentration, setConcentration] = useState(20); const [totalMl, setTotalMl] = useState(30); const [notes, setNotes] = useState(""); const [ifraCategory, setIfraCategory] = useState(""); const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>([]);
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate({ data: { name, brief, status: "draft", concentration, totalMl, notes, ifraCategory: ifraCategory || undefined, ingredients } }, { onSuccess: formula => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation(`/formulas/${formula.id}`); } }); };
  return <Shell><PageHeader eyebrow="New page · formula" title="Make a beginning." description="A formula is a hypothesis. Give it a clear brief, then let the materials answer back." /><FormulaIdeaGenerator onSelect={(n, b) => { setName(n); setBrief(b); }} /><form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><div className="space-y-5"><div className="border border-border bg-card p-6 sm:p-7"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p><label className="mt-5 block text-xs font-medium">Name<input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" placeholder="A name with a little weather" /></label><label className="mt-7 block text-xs font-medium">Creative brief <span className="font-normal text-muted-foreground">(optional)</span><textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-28 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="What should this scent make possible?" /></label><div className="mt-7 grid grid-cols-2 gap-4"><label className="text-xs font-medium">Concentration %<input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label><label className="text-xs font-medium">Batch size ml<input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label></div><IfraCategoryPicker value={ifraCategory} onChange={setIfraCategory} testId="select-formula-ifra-category" /><label className="mt-7 block text-xs font-medium">Notebook notes<textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, things to remember..." /></label></div></div><div className="space-y-5"><IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} totalMl={totalMl} concentration={concentration} /><div className="flex items-center justify-between border border-border bg-card p-5"><div><p className="font-display text-2xl">Keep it open.</p><p className="mt-1 text-xs text-muted-foreground">You can revise every field once it's in the library.</p></div><div className="flex items-center gap-2"><Button href="/formulas" variant="quiet" testId="button-cancel-new">Cancel</Button><Button type="submit" disabled={create.isPending || !name} testId="button-save-formula">{create.isPending ? "Saving..." : "Save draft"}</Button></div></div>{create.isError && <p className="text-sm text-destructive" data-testid="status-create-error">Couldn’t save this formula. Try again.</p>}</div></form></Shell>;
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
    <Shell><PageHeader eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · version ${formula.version}`} title={formula.name} description={formula.brief} action={<div className="flex gap-2"><Button onClick={begin} variant="outline" testId="button-edit-formula">Edit</Button><Button onClick={destroy} variant="quiet" testId="button-delete-formula">Delete</Button></div>} /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="space-y-6"><div className="border border-border bg-card p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula status</p><div className="mt-3 flex items-center gap-3"><StatusPill value={formula.status} /><StatusPill value={formula.safetyStatus} /><StatusPill value={formula.ifraStatus} /></div></div><div className="text-right"><p className="font-display text-4xl">{formula.concentration}%</p><p className="font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p></div></div></div><div className="border border-border bg-card p-6 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The structure</p><h2 className="mt-1 font-display text-3xl">Ingredient map</h2></div><div className="flex items-center gap-3 pt-1"><p className="font-mono-ui text-[10px] text-muted-foreground">{formula.ingredients.length} materials</p><button onClick={begin} data-testid="button-edit-inline" className="border border-border bg-secondary/60 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest text-foreground transition-colors hover:bg-secondary">Edit</button></div></div><div className="mt-5 space-y-1">{formula.ingredients.map((item, i) => <div key={`${item.materialId}-${i}`} data-testid={`row-ingredient-${item.materialId}`} className="grid grid-cols-[1fr_70px_70px] items-center gap-3 border-t border-border py-4"><div><p className="text-sm font-medium">{item.materialName}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{item.role}</p></div><p className="text-right font-mono-ui text-xs">{item.percentage}%</p><p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p></div>)}</div></div>{editing && (
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

  const convsQuery = useListConversations();
  const convQuery = useGetConversation(selectedConvId ?? 0, {
    query: { enabled: !!selectedConvId, queryKey: getGetConversationQueryKey(selectedConvId ?? 0) },
  });
  const createConv = useCreateConversation();
  const streamMsg = useStreamMessage();
  const deleteConv = useDeleteConversation();

  const conversations = convsQuery.data ?? [];
  const activeConv = convQuery.data;

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

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || "New session";
    createConv.mutate(
      { data: { title } },
      {
        onSuccess: (conv) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conv.id);
          setCreatingNew(false);
          setNewTitle("");
        },
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

  return (
    <Shell>
      <PageHeader
        eyebrow="Studio companion · creative lab"
        title="What are you working on?"
        description="Persistent coaching sessions — pick up a thread, or start a new one."
      />

      <div className="grid min-h-[600px] border-t border-border lg:grid-cols-[260px_1fr]">
        {/* ── Session list (left) ── */}
        <div className="border-b border-border lg:border-b-0 lg:border-r lg:border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Sessions</p>
            <button
              onClick={() => setCreatingNew(v => !v)}
              data-testid="button-new-session"
              className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground transition-colors hover:text-accent"
            >
              + New
            </button>
          </div>

          {creatingNew && (
            <form onSubmit={handleCreate} className="border-b border-border p-4">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Session title…"
                data-testid="input-session-title"
                className="w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/50"
              />
              <div className="mt-3 flex gap-2">
                <Button type="submit" disabled={createConv.isPending} testId="button-create-conv">
                  {createConv.isPending ? "Creating…" : "Create"}
                </Button>
                <Button onClick={() => { setCreatingNew(false); setNewTitle(""); }} variant="quiet" testId="button-cancel-create">Cancel</Button>
              </div>
            </form>
          )}

          {convsQuery.isLoading && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {!convsQuery.isLoading && conversations.length === 0 && (
            <p className="p-5 text-xs text-muted-foreground">No sessions yet.</p>
          )}

          <nav>
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`group w-full border-b border-border px-4 py-3 text-left transition-colors ${
                  selectedConvId === conv.id ? "bg-secondary/40" : "hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium">{conv.title}</p>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(conv.id); }}
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <X size={11} />
                  </button>
                </div>
                <p className="mt-0.5 font-mono-ui text-[8px] text-muted-foreground">
                  {conv.messageCount ?? 0} messages · {new Date(conv.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Conversation view (right) ── */}
        <div className="flex flex-col">
          {!selectedConvId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <div className="mb-5 grid size-16 place-items-center border border-dashed border-border text-muted-foreground">
                <MessageCircle size={22} strokeWidth={1.3} />
              </div>
              <p className="font-display text-3xl">
                {conversations.length ? "Select a session." : "Start your first session."}
              </p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {conversations.length
                  ? "Choose a session on the left, or start a new one."
                  : "Click «+ New» to open your first coaching conversation."}
              </p>
              {activeFormula && (
                <p className="mt-4 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">
                  Formula context ready: {activeFormula.name}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Formula badge */}
              {activeFormula && (
                <div className="flex items-center gap-2 border-b border-border px-6 py-2.5">
                  <FlaskConical size={10} className="text-muted-foreground" />
                  <p className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">
                    Context: {activeFormula.name} · {activeFormula.concentration}% · {activeFormula.ingredients.length} materials
                  </p>
                  <Link
                    href={`/formulas/${activeFormula.id}`}
                    data-testid="link-active-formula"
                    className="ml-auto font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    View ↗
                  </Link>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6" style={{ minHeight: 320, maxHeight: 540 }}>
                {convQuery.isLoading && <Skeleton className="h-20 w-full" />}

                {activeConv?.messages.length === 0 && !convQuery.isLoading && (
                  <div className="py-10 text-center">
                    <p className="font-display text-2xl">What are you working on?</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {activeFormula
                        ? `The lab knows about ${activeFormula.name}. Ask about its structure, a material, or what to try next.`
                        : "A difficult material, a flat drydown, a brief that won't settle. Bring the unfinished thought."}
                    </p>
                  </div>
                )}

                {activeConv?.messages.map(msg => (
                  <div key={msg.id} className={msg.role === "user" ? "pl-10" : "pr-10"}>
                    <p className="mb-1.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">
                      {msg.role === "user" ? "You" : "Lab"} ·{" "}
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div
                      className={
                        msg.role === "user"
                          ? "border border-border bg-secondary/30 p-4 text-sm leading-6"
                          : "border-l-2 border-accent pl-5 text-sm leading-7 text-foreground"
                      }
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <MarkdownMessage content={msg.content} />
                      )}
                    </div>
                  </div>
                ))}

                {streamMsg.isPending && (
                  <div className="pr-10">
                    <p className="mb-1.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Lab · now</p>
                    <div className="border-l-2 border-accent pl-5 text-sm leading-7 text-foreground">
                      {streamMsg.streamingContent ? (
                        <MarkdownMessage content={streamMsg.streamingContent} />
                      ) : (
                        <div className="flex gap-1.5 py-2">
                          {[0, 1, 2].map(i => (
                            <span
                              key={i}
                              className="size-1.5 rounded-full bg-accent/60 animate-pulse"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="border-t border-border p-4">
                <form onSubmit={handleSend} className="flex items-center gap-2 border border-border bg-secondary/30 p-2">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    disabled={streamMsg.isPending || !activeConv}
                    data-testid="input-coach-message"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                    placeholder={activeFormula ? `Ask about ${activeFormula.name}…` : "I'm working on…"}
                  />
                  <button
                    type="submit"
                    disabled={streamMsg.isPending || !message.trim() || !activeConv}
                    data-testid="button-send-coach"
                    className="grid size-9 shrink-0 place-items-center bg-primary text-primary-foreground disabled:opacity-40"
                  >
                    {streamMsg.isPending
                      ? <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      : <Send size={14} />}
                  </button>
                </form>
                {streamMsg.error && (
                  <p className="mt-2 text-xs text-destructive" data-testid="status-coach-error">
                    {streamMsg.error}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
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

function FieldNoteCard() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-160, 160], [7, -7]), { damping: 22, stiffness: 180 });
  const rotateY = useSpring(useTransform(mouseX, [-160, 160], [-7, 7]), { damping: 22, stiffness: 180 });
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
      <div className="absolute inset-0 overflow-hidden border border-border p-8 text-foreground pt-[108px] pb-[108px] pl-[64px] pr-[64px]">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-droplets.jpg`}
          alt="Macro photograph of perfume oil droplets on brushed steel"
          className="absolute inset-0 h-full w-full object-cover"
          data-testid="img-hero-photo"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#ffffffd9] via-[#ffffff66] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ffffffb8] to-transparent" />
        <div className="relative flex justify-between font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#3a3a3f]">
          <span>Field note 014</span><span>03.14</span>
        </div>
        <div className="absolute bottom-10 left-8 right-8 z-[1]">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl leading-[.82] text-[#423838]"
          >
            salt / iris<br /><em>old wood</em>
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72, duration: 0.6 }}
            className="mt-7 flex items-end justify-between"
          >
            <p className="max-w-[180px] text-sm leading-6 text-muted-foreground">A little mineral. A soft refusal. Something that stays after the room is empty.</p>
            <div className="grid size-20 place-items-center border border-border font-mono-ui text-[9px] text-center uppercase leading-3">20%<br />eau de parfum</div>
          </motion.div>
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
              className="max-w-3xl font-display tracking-[-.045em] text-[69px] text-[#000000] border-t-[#000000] border-r-[#000000] border-b-[#000000] border-l-[#000000] mb-[46px] pt-[0px] pb-[0px] mt-[172px]"
            >
              Where instinct meets <em className="text-[#000000] ml-[1px] mr-[1px]">precision.</em>
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

        {/* 01 / 02 / 03 — scroll-triggered zoom reveal */}
        <section className="border-t border-border text-[#ffffff] bg-[#ffffff] border-t-[#ffffff] border-r-[#ffffff] border-b-[#ffffff] border-l-[#ffffff]">
          <div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-3">
            {[
              { num: "01", label: "Notice", title: "Keep the brief close.", copy: "A home for the feeling before the formula starts to behave." },
              { num: "02", label: "Wander", title: "Make room for odd.", copy: "A material library and a creative lab that help you take the less obvious turn." },
              { num: "03", label: "Return", title: "Trust the record.", copy: "Safety context belongs beside the creative work, not in a separate room." },
            ].map(({ num, label, title, copy }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 52, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ duration: 0.7, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-border p-8 sm:border-b-0 sm:border-r ml-[0px] mr-[0px] pl-[65px] pr-[65px] pt-[24px] pb-[24px] mt-[-2px] mb-[-2px] font-medium bg-[#bdb5c7] border-t-[#38281903] border-r-[#38281903] border-b-[#38281903] border-l-[#38281903]"
              >
                <p className="font-mono-ui text-[#ffffff] text-[16px]">{num} / {label}</p>
                <h2 className="mt-16 font-display text-3xl text-[#ffffff]">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#ffffff]">{copy}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Precision — scroll-triggered slide + zoom */}
        <section className="mx-auto max-w-7xl border-t border-border px-5 py-24 sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <motion.div
              initial={{ opacity: 0, x: -32, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">A studio practice</p>
              <h2 className="mt-5 font-display text-5xl leading-[.9]">Precision can feel personal.</h2>
              <motion.img
                src={`${import.meta.env.BASE_URL}images/flower.jpg`}
                alt="A white flower against a dusk-violet sky"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 w-full max-w-md border border-border object-cover"
                data-testid="img-precision-flower"
              />
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: "Formula safety in the margin", copy: "Allergens and IFRA status stay visible at the exact moment a choice is made." },
                { title: "A library that remembers", copy: "Hold on to drafts, resting experiments, and the formula that finally clicked." },
              ].map(({ title, copy }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 28, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: i * 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="border-l border-border pl-5"
                >
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
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
  return <div className="grid min-h-[100dvh] place-items-center px-4 py-10 bg-[#ffffff]"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><Logo /></div><div className="relative z-10 w-full max-w-[440px] border border-border bg-card p-2 shadow-2xl">{kind === "in" ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function NotFoundView() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Page not found · 404</p><h1 className="mt-4 font-display text-6xl">A missing page.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This page drifted out of the notebook. The rest of the studio is still here.</p><div className="mt-7"><Button href="/" testId="button-return-home">Return to the desk</Button></div></div></div>;
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: "hsl(0 0% 7%)", colorForeground: "hsl(0 0% 7%)", colorMutedForeground: "hsl(0 0% 45%)", colorBackground: "hsl(0 0% 100%)", colorInput: "hsl(0 0% 94%)", colorInputForeground: "hsl(0 0% 7%)", colorDanger: "hsl(0 58% 48%)", colorNeutral: "hsl(0 0% 86%)", fontFamily: "Inter", borderRadius: "0rem" }, elements: { cardBox: "bg-card border border-border w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-foreground font-medium", headerSubtitle: "text-muted-foreground", formFieldLabel: "text-foreground", formFieldInput: "bg-secondary text-foreground border border-border", formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-80 rounded-none uppercase tracking-widest text-[11px]", footerActionLink: "text-foreground underline", socialButtonsBlockButtonText: "text-foreground", dividerText: "text-muted-foreground", footerActionText: "text-muted-foreground" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Switch><Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} /><Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} /><Route path="/"><HomeRedirect /></Route><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/formulas/new"><Protected><NewFormula /></Protected></Route><Route path="/formulas/:id"><Protected><FormulaDetail /></Protected></Route><Route path="/formulas"><Protected><Formulas /></Protected></Route><Route path="/materials"><Protected><Materials /></Protected></Route><Route path="/coach"><Protected><Coach /></Protected></Route><Route path="/shop"><Protected><Shop /></Protected></Route><Route><NotFoundView /></Route></Switch></WouterRouter></QueryClientProvider>
  </ClerkProvider>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Landing />;
  return isSignedIn ? <Redirect to="/coach" /> : <Landing />;
}