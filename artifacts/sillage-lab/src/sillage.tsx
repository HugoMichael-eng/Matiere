import { useState, useRef, useEffect } from "react";
import type { FormEvent, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowUpRight, Beaker, BookOpen, ChevronDown, ChevronRight, CircleAlert,
  FlaskConical, Gauge, Leaf, LogOut, Menu, MessageCircle, Minus, Plus,
  Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, X, ShoppingBag
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Redirect, Route, Switch, useLocation, useParams, useSearch, Router as WouterRouter } from "wouter";
import {
  getGetDashboardSummaryQueryKey, getGetFormulaQueryKey,
  getListFormulasQueryKey, useCreateFormula, useDeleteFormula,
  useGetDashboardSummary, useGetFormula, useListFormulas, useListMaterials,
  useSendCoachingMessage, useUpdateFormula,
} from "@workspace/api-client-react";
import type { Formula, FormulaIngredientInput, Material } from "@workspace/api-client-react";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className="flex items-center gap-3 group">
      <span className={`font-mono-ui text-[10px] font-medium uppercase tracking-[.35em] ${light ? "text-white" : "text-foreground"}`}>SILLAGE LAB</span>
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

const navItems = [
  { href: "/dashboard", label: "Studio desk", icon: Gauge },
  { href: "/formulas", label: "Formula library", icon: BookOpen },
  { href: "/materials", label: "Materials", icon: Leaf },
  { href: "/coach", label: "Creative lab", icon: MessageCircle },
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
  return <div className="flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
    <Logo /><button onClick={() => setOpen(!open)} data-testid="button-mobile-menu" className="p-2 text-muted-foreground hover:bg-secondary">{open ? <X size={19} /> : <Menu size={19} />}</button>
    {open && <div className="absolute left-3 right-3 top-[62px] z-40 border border-border bg-card p-2 shadow-xl">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`} className="flex items-center gap-3 px-3 py-3 text-xs tracking-widest uppercase hover:bg-secondary"><Icon size={14} />{label}</Link>)}</div>}
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-[100dvh] bg-background animate-fade-in"><Sidebar /><div className="min-w-0 flex-1"><MobileNav /><main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-11">{children}</main></div></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-9 flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.3em] text-muted-foreground">{eyebrow}</p><h1 className="mt-2 font-display text-5xl tracking-[-0.03em] leading-[.85] text-foreground sm:text-6xl" data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h1>{description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</header>;
}

function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  const style = value === "approved" || value === "clear" || value === "within_limit" ? "text-muted-foreground border-l-2 pl-2 border-border" : value === "blocked" || value === "exceeds_limit" ? "text-destructive" : "text-accent";
  return <span className={`inline-flex items-center font-mono-ui text-[9px] uppercase tracking-[.08em] ${style}`} data-testid={`status-${value}`}>{label}</span>;
}

function Skeleton({ className = "" }: { className?: string }) { return <div className={`animate-pulse bg-muted ${className}`} />; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="border border-destructive/30 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-3 font-display text-2xl">The studio is quiet.</p><p className="mt-1 text-sm text-muted-foreground">We couldn’t read your workspace just now.</p><div className="mt-4"><Button onClick={retry} variant="outline" testId="button-retry">Try again</Button></div></div>; }

function FormulaRow({ formula }: { formula: Formula }) {
  return <Link href={`/formulas/${formula.id}`} data-testid={`row-formula-${formula.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-5 transition-colors hover:bg-secondary sm:grid-cols-[1.5fr_1fr_110px_110px_24px]">
    <div className="min-w-0"><p className="truncate text-sm font-medium">{formula.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{formula.brief || "No brief yet"}</p></div>
    <div className="hidden text-xs text-muted-foreground sm:block">{formula.ingredients?.length ?? 0} materials</div>
    <div className="hidden sm:block"><StatusPill value={formula.status} /></div>
    <div className="hidden text-right font-mono-ui text-[10px] text-muted-foreground sm:block">{new Date(formula.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
    <ChevronRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
  </Link>;
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const summary = summaryQuery.data;
  if (summaryQuery.isLoading) return <Shell><div className="space-y-7"><Skeleton className="h-32 w-2/3" /><div className="grid gap-4 sm:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-80" /></div></Shell>;
  if (summaryQuery.isError || !summary) return <Shell><ErrorState retry={() => summaryQuery.refetch()} /></Shell>;
  const metrics: Array<[string, number, LucideIcon]> = [
    ["Saved formulas", summary.formulaCount, BookOpen],
    ["Material library", summary.materialCount, Leaf],
    ["Needs a second look", summary.reviewCount, ShieldCheck],
    ["Allergen notes", summary.allergenCount, CircleAlert],
  ];
  return <Shell><PageHeader eyebrow="Wednesday · studio desk" title="Good morning, maker." description="A clear view of the work that’s still becoming." action={<Button href="/formulas/new" testId="button-new-formula">New formula</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([label, count, Icon], i) => <div key={label} data-testid={`metric-${i}`} className="border border-border p-5 bg-card text-foreground"><div className="flex items-start justify-between"><p className="max-w-[120px] text-[11px] leading-4 text-muted-foreground">{label}</p><Icon size={17} strokeWidth={1.6} className="text-muted-foreground" /></div><p className="mt-5 font-display text-4xl">{count}</p></div>)}
    </div>
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_.8fr]">
      <section className="border border-border bg-card p-6 sm:p-7"><div className="mb-3 flex items-center justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">The notebook, recently</p><h2 className="mt-1 font-display text-3xl">Latest formulas</h2></div><Link href="/formulas" data-testid="link-view-all-formulas" className="text-[11px] uppercase tracking-widest text-foreground hover:underline">View all</Link></div>{summary.recentFormulas.length ? summary.recentFormulas.map(formula => <FormulaRow key={formula.id} formula={formula} />) : <EmptyState title="Your first formula is waiting." copy="Start with a feeling, a material, or a strange little question." href="/formulas/new" label="Open a fresh page" />}</section>
      <section className="border border-border bg-card p-7 text-foreground"><Sparkles size={19} className="text-muted-foreground" /><p className="mt-12 font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">Creative focus</p><p className="mt-3 font-display text-[31px] leading-[1.02] text-accent" data-testid="text-focus-prompt">{summary.focusPrompt}</p><Link href="/coach" data-testid="link-open-coach" className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest hover:underline">Open creative lab <ArrowUpRight size={14} /></Link></section>
    </div>
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-border bg-secondary/30 p-6 sm:p-7">
      <div>
        <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Supplier sourcing</p>
        <h2 className="mt-2 font-display text-3xl">Stock the palette.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Browse Fraterworks, PCW, and Contrebande — the three suppliers this studio tracks.</p>
      </div>
      <div className="shrink-0">
        <Button href="/shop" testId="button-dashboard-shop">Browse shop</Button>
      </div>
    </div>
  </Shell>;
}

function EmptyState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return <div className="my-4 py-16 text-center border border-border bg-secondary/30"><p className="mt-4 font-display text-3xl">{title}</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{copy}</p><div className="mt-6"><Button href={href} variant="outline" testId="button-empty-action">{label}</Button></div></div>;
}

function Formulas() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "resting" | "approved">("all");
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
      next.grams = parseFloat(((next.percentage / 100) * totalMl).toFixed(3));
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
            const grams = parseFloat(((ingredient.percentage / 100) * totalMl).toFixed(3));
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
                      Formula %{ingredient.percentage > 0 && (
                        <span className="ml-2 text-foreground">{grams}g</span>
                      )}
                    </span>
                    <input
                      type="number" min="0" max="100" step="0.1"
                      value={ingredient.percentage}
                      onChange={e => update(index, { percentage: Number(e.target.value) })}
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
                {ingredient.percentage > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      {/* Progress bar */}
                      <div className="h-[2px] flex-1 overflow-hidden bg-border">
                        <motion.div
                          className="h-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(ingredient.percentage, 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex shrink-0 gap-3 font-mono-ui text-[9px] text-muted-foreground">
                        <span title="Grams to weigh out"><strong className="text-foreground">{grams}g</strong> to weigh</span>
                        {dilution < 100 && (
                          <span title={`${activeGrams}g is pure aromatic material; the rest is solvent`}>{activeGrams}g active aromatic</span>
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
            <span className={`font-mono-ui text-[10px] ${totalPct > 100 ? "text-destructive" : totalPct === 100 ? "text-accent" : "text-muted-foreground"}`}>
              {totalPct}% of formula
            </span>
          </div>
          {totalPct > 100 && <span className="font-mono-ui text-[9px] text-destructive">Exceeds 100%</span>}
          {totalPct === 100 && <span className="font-mono-ui text-[9px] text-accent">Palette complete</span>}
          {totalPct > 0 && totalPct < 100 && (
            <span className="font-mono-ui text-[9px] text-muted-foreground">{Math.round((100 - totalPct) * 10) / 10}% remaining</span>
          )}
        </motion.div>
      )}
    </div>
  );
}

function NewFormula() {
  const [, setLocation] = useLocation();
  const create = useCreateFormula();
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [brief, setBrief] = useState(""); const [concentration, setConcentration] = useState(20); const [totalMl, setTotalMl] = useState(30); const [notes, setNotes] = useState(""); const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>([]);
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate({ data: { name, brief, status: "draft", concentration, totalMl, notes, ingredients } }, { onSuccess: formula => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation(`/formulas/${formula.id}`); } }); };
  return <Shell><PageHeader eyebrow="New page · formula" title="Make a beginning." description="A formula is a hypothesis. Give it a clear brief, then let the materials answer back." action={<Button href="/formulas" variant="quiet" testId="button-cancel-new">Cancel</Button>} /><form onSubmit={submit} className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><div className="space-y-5"><div className="border border-border bg-card p-6 sm:p-7"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p><label className="mt-5 block text-xs font-medium">Name<input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" placeholder="A name with a little weather" /></label><label className="mt-7 block text-xs font-medium">Creative brief <span className="font-normal text-muted-foreground">(optional)</span><textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-28 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="What should this scent make possible?" /></label><div className="mt-7 grid grid-cols-2 gap-4"><label className="text-xs font-medium">Concentration %<input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label><label className="text-xs font-medium">Batch size ml<input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-foreground/40" /></label></div><label className="mt-7 block text-xs font-medium">Notebook notes<textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" placeholder="Observations, references, things to remember..." /></label></div></div><div className="space-y-5"><IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} totalMl={totalMl} concentration={concentration} /><div className="flex items-center justify-between border border-border bg-card p-5"><div><p className="font-display text-2xl">Keep it open.</p><p className="mt-1 text-xs text-muted-foreground">You can revise every field once it’s in the library.</p></div><Button type="submit" disabled={create.isPending || !name} testId="button-save-formula">{create.isPending ? "Saving..." : "Save draft"}</Button></div>{create.isError && <p className="text-sm text-destructive" data-testid="status-create-error">Couldn’t save this formula. Try again.</p>}</div></form></Shell>;
}

function FormulaDetail() {
  const params = useParams<{ id: string }>(); const id = Number(params.id);
  const query = useGetFormula(id, { query: { enabled: Number.isFinite(id), queryKey: getGetFormulaQueryKey(id) } });
  const update = useUpdateFormula(); const remove = useDeleteFormula(); const qc = useQueryClient(); const [, setLocation] = useLocation();
  const formula = query.data;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(""); const [brief, setBrief] = useState(""); const [notes, setNotes] = useState(""); const [status, setStatus] = useState<"draft" | "resting" | "approved" | "archived">("draft");
  const [editConcentration, setEditConcentration] = useState(20); const [editTotalMl, setEditTotalMl] = useState(30);
  const [editIngredients, setEditIngredients] = useState<FormulaIngredientInput[]>([]);
  const begin = () => {
    if (!formula) return;
    setName(formula.name); setBrief(formula.brief); setNotes(formula.notes ?? ""); setStatus(formula.status);
    setEditConcentration(formula.concentration); setEditTotalMl(formula.totalMl);
    setEditIngredients(formula.ingredients.map(i => ({ materialId: i.materialId, materialName: i.materialName, percentage: i.percentage, grams: i.grams, dilution: i.dilution ?? 100, role: i.role as FormulaIngredientInput["role"], allergenFlags: i.allergenFlags ?? [] })));
    setEditing(true);
  };
  const save = () => update.mutate({ id, data: { name, brief, notes, status, concentration: editConcentration, totalMl: editTotalMl, ingredients: editIngredients } }, { onSuccess: result => { qc.setQueryData(getGetFormulaQueryKey(id), result); qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setEditing(false); } });
  const destroy = () => { if (window.confirm("Delete this formula from the library?")) remove.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setLocation("/formulas"); } }); };
  if (query.isLoading) return <Shell><Skeleton className="h-72" /></Shell>;
  if (query.isError || !formula) return <Shell><ErrorState retry={() => query.refetch()} /></Shell>;
  return <Shell><PageHeader eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · version ${formula.version}`} title={formula.name} description={formula.brief} action={<div className="flex gap-2"><Button onClick={begin} variant="outline" testId="button-edit-formula">Edit</Button><Button onClick={destroy} variant="quiet" testId="button-delete-formula">Delete</Button></div>} /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="space-y-6"><div className="border border-border bg-card p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula status</p><div className="mt-3 flex items-center gap-3"><StatusPill value={formula.status} /><StatusPill value={formula.safetyStatus} /><StatusPill value={formula.ifraStatus} /></div></div><div className="text-right"><p className="font-display text-4xl">{formula.concentration}%</p><p className="font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p></div></div></div><div className="border border-border bg-card p-6 sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The structure</p><h2 className="mt-1 font-display text-3xl">Ingredient map</h2></div><div className="flex items-center gap-3 pt-1"><p className="font-mono-ui text-[10px] text-muted-foreground">{formula.ingredients.length} materials</p><button onClick={begin} data-testid="button-edit-inline" className="border border-border bg-secondary/60 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest text-foreground transition-colors hover:bg-secondary">Edit</button></div></div><div className="mt-5 space-y-1">{formula.ingredients.map((item, i) => <div key={`${item.materialId}-${i}`} data-testid={`row-ingredient-${item.materialId}`} className="grid grid-cols-[1fr_70px_70px] items-center gap-3 border-t border-border py-4"><div><p className="text-sm font-medium">{item.materialName}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{item.role}</p></div><p className="text-right font-mono-ui text-xs">{item.percentage}%</p><p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p></div>)}</div></div>{editing && (
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
                        <label className="mt-5 block text-xs font-medium">Name
                          <input value={name} onChange={e => setName(e.target.value)} data-testid="input-edit-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-foreground" />
                        </label>
                        <label className="mt-7 block text-xs font-medium">Creative brief <span className="font-normal text-muted-foreground">(optional)</span>
                          <textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-edit-brief" className="mt-2 min-h-24 w-full resize-none border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-foreground/40" />
                        </label>
                        <div className="mt-7 grid grid-cols-2 gap-4">
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
            )}</section><aside className="space-y-6"><div className="border border-border bg-secondary p-6 text-foreground"><ShieldCheck size={20} className="text-muted-foreground" /><p className="mt-5 font-display text-3xl">Safety, without the mood-kill.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Sillage keeps the guardrails visible so you can keep your attention on the shape of the scent.</p><div className="mt-6 space-y-2 border-t border-border pt-5 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Allergen notes</span><span data-testid="text-formula-allergens">{formula.allergenCount}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Last touched</span><span>{new Date(formula.updatedAt).toLocaleDateString()}</span></div></div></div><div className="border border-border bg-card p-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Notebook</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground" data-testid="text-formula-notes">{formula.notes || "No notes yet. Leave a trace for the next session."}</p></div><div className="border border-border bg-card p-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Studio</p><h3 className="mt-3 font-display text-2xl leading-none">Take it to the lab.</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Open this formula in the Creative Lab — the coach will know exactly what you're working on.</p><div className="mt-5 space-y-2"><Button href={`/coach?formula=${formula.id}`} testId="button-formula-to-lab">Open in Creative Lab</Button><Button onClick={begin} variant="outline" testId="button-formula-edit-studio">Edit formula</Button></div></div></aside></div></Shell>;
}

function Coach() {
  const search = useSearch();
  const rawFormulaId = new URLSearchParams(search).get("formula");
  const formulaId = rawFormulaId ? Number(rawFormulaId) : null;
  const formulaQuery = useGetFormula(formulaId ?? 0, {
    query: { enabled: !!formulaId && Number.isFinite(formulaId), queryKey: getGetFormulaQueryKey(formulaId ?? 0) },
  });
  const activeFormula = formulaQuery.data ?? null;

  const buildContext = (f: typeof activeFormula): string | null => {
    if (!f) return null;
    const lines = [
      `Formula: ${f.name}`,
      f.brief ? `Brief: ${f.brief}` : null,
      `Concentration: ${f.concentration}% EDP`,
      `Batch size: ${f.totalMl}ml`,
      f.ingredients.length
        ? `Ingredients: ${f.ingredients.map(i => `${i.materialName} ${i.percentage}% (${i.role})`).join(", ")}`
        : null,
      f.notes ? `Notes: ${f.notes}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<{ reply: string; suggestions: string[]; cautions: string[] } | null>(null);
  const send = useSendCoachingMessage();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const ctx = buildContext(activeFormula);
    send.mutate(
      { data: { message, formulaId: formulaId ?? null, formulaContext: ctx } },
      { onSuccess: result => { setReply(result); setMessage(""); } },
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Studio companion · creative lab"
        title="Ask better questions."
        description="A thoughtful second nose for when the next move is just out of reach."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_.7fr]">
        <section className="min-h-[520px] border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center bg-secondary text-foreground"><Sparkles size={19} /></div>
              <div>
                <p className="text-sm font-medium">Creative lab</p>
                <p className="text-xs text-muted-foreground">Creative direction, with a safety-aware eye</p>
              </div>
            </div>
            {activeFormula && (
              <Link href={`/formulas/${activeFormula.id}`} className="flex items-center gap-1.5 border border-border bg-secondary/60 px-3 py-1.5 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground" data-testid="link-active-formula">
                <FlaskConical size={10} />
                {activeFormula.name}
              </Link>
            )}
            {formulaId && formulaQuery.isLoading && (
              <span className="font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">Loading formula…</span>
            )}
          </div>

          {activeFormula && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border border-border bg-secondary/40 px-4 py-3"
            >
              <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Active formula context</p>
              <p className="mt-1 text-sm font-medium">{activeFormula.name}</p>
              {activeFormula.brief && <p className="mt-0.5 text-xs text-muted-foreground">{activeFormula.brief}</p>}
              <p className="mt-1.5 font-mono-ui text-[9px] text-muted-foreground">
                {activeFormula.concentration}% · {activeFormula.totalMl}ml · {activeFormula.ingredients.length} ingredients
              </p>
            </motion.div>
          )}

          {reply ? (
            <div className="animate-fade-in pt-8">
              <p className="font-display text-4xl leading-tight text-accent">{reply.reply}</p>
              {reply.suggestions.length > 0 && (
                <div className="mt-8">
                  <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Try this next</p>
                  <ul className="mt-3 space-y-2">
                    {reply.suggestions.map((suggestion, i) => (
                      <li key={i} data-testid={`text-coach-suggestion-${i}`} className="flex gap-2 border border-border bg-card p-4 text-sm leading-5">
                        <span className="font-mono-ui text-muted-foreground">0{i + 1}</span>{suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reply.cautions.length > 0 && (
                <div className="mt-6 border border-border bg-card p-4 text-xs leading-5">
                  <p className="font-medium">Keep in mind</p>
                  {reply.cautions.map((caution, i) => <p key={i} className="mt-1 text-muted-foreground">{caution}</p>)}
                </div>
              )}
              <button onClick={() => setReply(null)} data-testid="button-new-coach-question" className="mt-7 text-[11px] uppercase tracking-widest text-foreground hover:underline">
                Ask another question
              </button>
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-6 grid size-20 place-items-center border border-dashed border-border bg-secondary text-muted-foreground">
                <MessageCircle size={26} strokeWidth={1.3} />
              </div>
              <p className="font-display text-3xl">What are you circling?</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {activeFormula
                  ? `The lab knows about ${activeFormula.name}. Ask about its structure, a material choice, or what to try next.`
                  : "A difficult material, a flat drydown, a brief that won't settle. Bring the unfinished thought."}
              </p>
            </div>
          )}

          <form onSubmit={submit} className="mt-8 flex items-center gap-2 border border-border bg-secondary/45 p-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={send.isPending}
              data-testid="input-coach-message"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
              placeholder={activeFormula ? `Ask about ${activeFormula.name}…` : "I'm trying to make…"}
            />
            <button type="submit" disabled={send.isPending || !message.trim()} data-testid="button-send-coach" className="grid size-10 shrink-0 place-items-center bg-primary text-primary-foreground disabled:opacity-40">
              {send.isPending ? <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Send size={15} />}
            </button>
          </form>
          {send.isError && <p className="mt-2 text-xs text-destructive" data-testid="status-coach-error">The coach couldn't answer. Please try again.</p>}
        </section>

        <aside className="space-y-5">
          <div className="border border-border bg-card p-7 text-foreground">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Good prompts have texture</p>
            <h2 className="mt-3 font-display text-4xl leading-none">Start with a sensation, not a solution.</h2>
            <div className="mt-8 space-y-3">
              {["How do I make a clean musk feel less obvious?", "The opening is beautiful but disappears too fast.", "I want warmth without sweetness."].map((prompt, i) => (
                <button key={prompt} onClick={() => setMessage(prompt)} data-testid={`button-prompt-${i}`} className="w-full border border-border bg-secondary/40 p-4 text-left text-sm leading-5 transition-colors hover:bg-secondary">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          {activeFormula && (
            <div className="border border-border bg-card p-6">
              <p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula</p>
              <h3 className="mt-2 font-display text-2xl">{activeFormula.name}</h3>
              <div className="mt-4 space-y-1">
                {activeFormula.ingredients.slice(0, 6).map((ing, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-t border-border text-xs text-muted-foreground">
                    <span>{ing.materialName}</span>
                    <span className="font-mono-ui">{ing.percentage}%</span>
                  </div>
                ))}
                {activeFormula.ingredients.length > 6 && (
                  <p className="pt-2 font-mono-ui text-[9px] text-muted-foreground">+{activeFormula.ingredients.length - 6} more</p>
                )}
              </div>
              <div className="mt-5">
                <Button href={`/formulas/${activeFormula.id}`} variant="outline" testId="link-back-to-formula">Back to formula</Button>
              </div>
            </div>
          )}
        </aside>
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
      <div className="absolute inset-0 overflow-hidden border border-border bg-card p-8 text-foreground">
        <div className="flex justify-between font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">
          <span>Field note 014</span><span>03.14</span>
        </div>
        <div className="absolute bottom-10 left-8 right-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl leading-[.82]"
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
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
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

      <main>
        {/* Hero — scroll zoom layer */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 overflow-visible px-5 pb-20 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-32">
          <motion.div
            style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
            className="origin-bottom-left"
          >
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-muted-foreground"
            >
              A creative perfumery workspace
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 36, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-3xl font-display text-[clamp(4rem,9vw,8.5rem)] leading-[.83] tracking-[-.045em]"
            >
              Make the scent <em className="text-accent">stranger.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 max-w-lg text-base leading-7 text-muted-foreground"
            >
              Sillage Lab is a focused studio for independent perfumers: keep the instinct, keep the record, keep formula safety close enough to trust.
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
        <section className="border-t border-border bg-background">
          <div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-3">
            {[
              { num: "01", label: "Notice", title: "Keep the brief close.", copy: "A home for the feeling before the formula starts to behave." },
              { num: "02", label: "Wander", title: "Make room for odd.", copy: "A material library and a coach that help you take the less obvious turn." },
              { num: "03", label: "Return", title: "Trust the record.", copy: "Safety context belongs beside the creative work, not in a separate room." },
            ].map(({ num, label, title, copy }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 52, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ duration: 0.7, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                className={`border-b border-border p-8 sm:border-b-0 ${i < 2 ? "sm:border-r" : ""}`}
              >
                <p className="font-mono-ui text-[10px] text-muted-foreground">{num} / {label}</p>
                <h2 className="mt-16 font-display text-3xl text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
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
          <span className="font-mono-ui uppercase tracking-[.14em]">Sillage Lab · for independent noses</span>
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
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><Logo /></div><div className="relative z-10 w-full max-w-[440px] border border-border bg-card p-2 shadow-2xl">{kind === "in" ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function NotFoundView() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Page not found · 404</p><h1 className="mt-4 font-display text-6xl">A missing page.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This page drifted out of the notebook. The rest of the studio is still here.</p><div className="mt-7"><Button href="/" testId="button-return-home">Return to the desk</Button></div></div></div>;
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: "hsl(0 0% 7%)", colorForeground: "hsl(0 0% 7%)", colorMutedForeground: "hsl(0 0% 45%)", colorBackground: "hsl(0 0% 100%)", colorInput: "hsl(0 0% 94%)", colorInputForeground: "hsl(0 0% 7%)", colorDanger: "hsl(0 58% 48%)", colorNeutral: "hsl(0 0% 86%)", fontFamily: "Inter", borderRadius: "0rem" }, elements: { cardBox: "bg-card border border-border w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-foreground font-medium", headerSubtitle: "text-muted-foreground", formFieldLabel: "text-foreground", formFieldInput: "bg-secondary text-foreground border border-border", formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-80 rounded-none uppercase tracking-widest text-[11px]", footerActionLink: "text-accent", socialButtonsBlockButtonText: "text-foreground", dividerText: "text-muted-foreground", footerActionText: "text-muted-foreground" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Switch><Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} /><Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} /><Route path="/"><HomeRedirect /></Route><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/formulas/new"><Protected><NewFormula /></Protected></Route><Route path="/formulas/:id"><Protected><FormulaDetail /></Protected></Route><Route path="/formulas"><Protected><Formulas /></Protected></Route><Route path="/materials"><Protected><Materials /></Protected></Route><Route path="/coach"><Protected><Coach /></Protected></Route><Route path="/shop"><Protected><Shop /></Protected></Route><Route><NotFoundView /></Route></Switch></WouterRouter></QueryClientProvider>
  </ClerkProvider>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Landing />;
  return isSignedIn ? <Redirect to="/dashboard" /> : <Landing />;
}