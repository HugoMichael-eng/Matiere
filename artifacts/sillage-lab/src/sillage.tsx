import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight, Beaker, BookOpen, ChevronDown, ChevronRight, CircleAlert,
  Flower2, Gauge, Leaf, LogOut, Menu, MessageCircle, Minus, Plus,
  Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, Redirect, Route, Switch, useLocation, useParams, Router as WouterRouter } from "wouter";
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

const colors = {
  teal: "hsl(188 41% 22%)",
  amber: "hsl(28 72% 61%)",
  ink: "hsl(189 31% 17%)",
};

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" data-testid="link-brand" className="flex items-center gap-3 group">
      <span className={`relative grid size-9 place-items-center rounded-[13px] ${light ? "bg-[#edaa62] text-[#173d43]" : "bg-primary text-primary-foreground"} shadow-sm`}>
        <Flower2 size={19} strokeWidth={1.6} />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#8bbd83]" />
      </span>
      <span className={`font-mono-ui text-[11px] font-medium uppercase tracking-[.22em] ${light ? "text-background" : "text-foreground"}`}>Sillage Lab</span>
    </Link>
  );
}

function Button({ children, onClick, href, variant = "primary", testId, disabled, type = "button" }: {
  children: ReactNode; onClick?: () => void; href?: string; variant?: "primary" | "quiet" | "outline" | "danger";
  testId: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold tracking-[.01em] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${
    variant === "primary" ? "bg-primary text-primary-foreground shadow-[0_5px_0_hsl(188_41%_15%/.14)]" :
    variant === "outline" ? "border border-border bg-card text-foreground hover:bg-secondary" :
    variant === "danger" ? "bg-destructive text-destructive-foreground" :
    "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} data-testid={testId}>{children}</button>;
}

const navItems = [
  { href: "/dashboard", label: "Studio desk", icon: Gauge },
  { href: "/formulas", label: "Formula library", icon: BookOpen },
  { href: "/materials", label: "Materials", icon: Leaf },
  { href: "/coach", label: "The coach", icon: MessageCircle },
];

function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  return (
    <aside className="hidden min-h-[100dvh] w-[252px] shrink-0 flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex">
      <Logo light />
      <div className="mt-12">
        <p className="mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/45">Workbench</p>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return <Link href={href} key={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[12px] transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}>
              <Icon size={16} strokeWidth={1.7} /><span>{label}</span>{active && <ChevronRight className="ml-auto" size={14} />}
            </Link>;
          })}
        </nav>
      </div>
      <div className="mt-auto">
        <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4">
          <p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#edaa62]">Today’s cue</p>
          <p className="mt-2 font-display text-lg leading-tight text-sidebar-foreground">Leave one note for your future nose.</p>
        </div>
        <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
          <div className="grid size-8 place-items-center rounded-full bg-[#d8e2cd] text-[11px] font-bold text-primary">{(user?.firstName?.[0] ?? "S")}{(user?.lastName?.[0] ?? "")}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{user?.firstName ?? "Independent perfumer"}</p><p className="truncate text-[10px] text-sidebar-foreground/45">{user?.primaryEmailAddress?.emailAddress ?? "Studio account"}</p></div>
          <button onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-sign-out" className="text-sidebar-foreground/50 hover:text-[#edaa62]" aria-label="Sign out"><LogOut size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return <div className="flex items-center justify-between border-b border-border bg-background px-5 py-4 md:hidden">
    <Logo /><button onClick={() => setOpen(!open)} data-testid="button-mobile-menu" className="rounded-full p-2 text-muted-foreground hover:bg-secondary">{open ? <X size={19} /> : <Menu size={19} />}</button>
    {open && <div className="absolute left-3 right-3 top-[62px] z-40 rounded-2xl border border-border bg-card p-2 shadow-xl">{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-mobile-${label.toLowerCase().replaceAll(" ", "-")}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-secondary"><Icon size={16} />{label}</Link>)}</div>}
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="paper-grain flex min-h-[100dvh] bg-background"><Sidebar /><div className="min-w-0 flex-1"><MobileNav /><main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-11">{children}</main></div></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-9 flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent-foreground/65">{eyebrow}</p><h1 className="mt-2 font-display text-5xl leading-[.9] tracking-[-.025em] text-foreground sm:text-6xl" data-testid={`heading-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h1>{description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</header>;
}

function StatusPill({ value }: { value: string }) {
  const label = value.replaceAll("_", " ");
  const style = value === "approved" || value === "clear" || value === "within_limit" ? "bg-[#d8e2cd] text-[#315c46]" : value === "blocked" || value === "exceeds_limit" ? "bg-[#f4d7d0] text-[#9b3e38]" : "bg-[#f2dfb7] text-[#755c27]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.08em] ${style}`} data-testid={`status-${value}`}><span className="size-1.5 rounded-full bg-current" />{label}</span>;
}

function Skeleton({ className = "" }: { className?: string }) { return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-3 font-display text-2xl">The studio is quiet.</p><p className="mt-1 text-sm text-muted-foreground">We couldn’t read your workspace just now.</p><Button onClick={retry} variant="outline" testId="button-retry">Try again</Button></div>; }

function FormulaRow({ formula }: { formula: Formula }) {
  return <Link href={`/formulas/${formula.id}`} data-testid={`row-formula-${formula.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-5 transition-colors hover:bg-secondary/55 sm:grid-cols-[1.5fr_1fr_110px_110px_24px]">
    <div className="min-w-0"><p className="truncate text-sm font-semibold">{formula.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{formula.brief || "No brief yet"}</p></div>
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
  const metrics: Array<[string, number, LucideIcon, string]> = [
    ["Saved formulas", summary.formulaCount, BookOpen, "ink"],
    ["Material library", summary.materialCount, Leaf, "sage"],
    ["Needs a second look", summary.reviewCount, ShieldCheck, "amber"],
    ["Allergen notes", summary.allergenCount, CircleAlert, "rose"],
  ];
  return <Shell><PageHeader eyebrow="Wednesday · studio desk" title="Good morning, maker." description="A clear view of the work that’s still becoming." action={<Button href="/formulas/new" testId="button-new-formula"><Plus size={15} /> New formula</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([label, count, Icon, tone], i) => <div key={label} data-testid={`metric-${i}`} className={`animate-drift-in rounded-2xl border border-border p-5 ${tone === "ink" ? "bg-primary text-primary-foreground" : tone === "sage" ? "bg-[#d8e2cd]" : tone === "amber" ? "bg-[#f2dfb7]" : "bg-[#f4d7d0]"}`} style={{ animationDelay: `${i * 70}ms` }}><div className="flex items-start justify-between"><p className="max-w-[120px] text-[11px] leading-4 opacity-70">{label}</p><Icon size={17} strokeWidth={1.6} /></div><p className="mt-5 font-display text-4xl">{count}</p></div>)}
    </div>
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_.8fr]">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7"><div className="mb-3 flex items-center justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.18em] text-muted-foreground">The notebook, recently</p><h2 className="mt-1 font-display text-3xl">Latest formulas</h2></div><Link href="/formulas" data-testid="link-view-all-formulas" className="text-xs font-semibold text-accent-foreground hover:underline">View all</Link></div>{summary.recentFormulas.length ? summary.recentFormulas.map(formula => <FormulaRow key={formula.id} formula={formula} />) : <EmptyState title="Your first formula is waiting." copy="Start with a feeling, a material, or a strange little question." href="/formulas/new" label="Open a fresh page" />}</section>
      <section className="relative overflow-hidden rounded-2xl bg-[#edaa62] p-7 text-[#173d43]"><div className="absolute -right-14 -top-14 size-44 rounded-full border-[18px] border-[#f5c987]/60 animate-breathe" /><Sparkles size={19} /><p className="mt-12 font-mono-ui text-[9px] uppercase tracking-[.18em] opacity-65">Creative focus</p><p className="mt-3 font-display text-[31px] leading-[1.02]" data-testid="text-focus-prompt">{summary.focusPrompt}</p><Link href="/coach" data-testid="link-open-coach" className="mt-8 inline-flex items-center gap-2 text-xs font-bold">Take it to the coach <ArrowUpRight size={14} /></Link></section>
    </div>
  </Shell>;
}

function EmptyState({ title, copy, href, label }: { title: string; copy: string; href: string; label: string }) {
  return <div className="studio-grid my-4 rounded-xl p-8 text-center"><Beaker className="mx-auto text-accent-foreground/50" size={22} /><p className="mt-4 font-display text-2xl">{title}</p><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{copy}</p><Button href={href} variant="outline" testId="button-empty-action">{label}</Button></div>;
}

function Formulas() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "resting" | "approved">("all");
  const query = useListFormulas({ search: search || undefined, status: status === "all" ? undefined : status });
  const formulas = query.data ?? [];
  return <Shell><PageHeader eyebrow="Library · formulas" title="Formula library" description="The living record of what you’ve made, paused, and almost made." action={<Button href="/formulas/new" testId="button-library-new"><Plus size={15} /> New formula</Button>} />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or brief..." data-testid="input-formula-search" className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-accent" /></div><select value={status} data-testid="select-formula-status" className="rounded-full border border-border bg-card px-4 py-3 text-xs font-semibold outline-none" onChange={e => setStatus(e.target.value as typeof status)}><option value="all">All stages</option><option value="draft">Drafts</option><option value="resting">Resting</option><option value="approved">Approved</option></select></div>
    <div className="rounded-2xl border border-border bg-card px-5 sm:px-7"><div className="hidden grid-cols-[1.5fr_1fr_110px_110px_24px] gap-4 border-b border-border py-3 font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground sm:grid"><span>Formula</span><span>Palette</span><span>Stage</span><span className="text-right">Changed</span><span /></div>{query.isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="my-5 h-14" />) : query.isError ? <ErrorState retry={() => query.refetch()} /> : formulas.length ? formulas.map(formula => <FormulaRow key={formula.id} formula={formula} />) : <EmptyState title="No formulas found." copy="Try another search, or give the next one a name." href="/formulas/new" label="Start a formula" />}</div>
  </Shell>;
}

function Materials() {
  const [search, setSearch] = useState("");
  const query = useListMaterials({ search: search || undefined });
  const materials = query.data ?? [];
  return <Shell><PageHeader eyebrow="Library · raw materials" title="Materials" description="A tactile index of the things that make a formula feel alive." />
    <div className="mb-6 flex items-center gap-3"><div className="relative max-w-md flex-1"><Search size={16} className="absolute left-4 top-3.5 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials, families, origins..." data-testid="input-material-search" className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-accent" /></div><span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:block" data-testid="text-material-count">{materials.length} indexed</span></div>
    {query.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-56" />)}</div> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{materials.map(material => <MaterialCard key={material.id} material={material} />)}{!materials.length && <div className="col-span-full"><EmptyState title="No materials in that drawer." copy="Try a different search term." href="/materials" label="Clear search" /></div>}</div>}
  </Shell>;
}

function MaterialCard({ material }: { material: Material }) {
  const [expanded, setExpanded] = useState(false);
  return <article className="group rounded-2xl border border-border bg-card p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg" data-testid={`card-material-${material.id}`}><div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#d8e2cd] text-[#315c46]"><Leaf size={18} strokeWidth={1.5} /></div><StatusPill value={material.safetyStatus} /></div><h3 className="mt-5 font-display text-2xl leading-none" data-testid={`text-material-name-${material.id}`}>{material.name}</h3><p className="mt-2 text-xs text-muted-foreground">{material.family} · {material.origin}</p><div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-ui text-[9px] uppercase tracking-[.11em] text-muted-foreground"><span>IFRA {material.ifraLimit}%</span><span>{material.inStock ? "In stock" : "To source"}</span></div><button onClick={() => setExpanded(!expanded)} data-testid={`button-material-details-${material.id}`} className="mt-4 flex w-full items-center justify-between text-left text-xs font-semibold text-accent-foreground">{expanded ? "Hide notes" : "Read usage notes"}<ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground animate-drift-in"><p>{material.usageNotes}</p>{material.allergens.length > 0 && <p className="mt-2 text-[#9b3e38]">Allergens to note: {material.allergens.join(", ")}</p>}<p className="mt-2 font-mono-ui text-[9px]">CAS {material.casNumber ?? "Not listed"}</p></div>}</article>;
}

function IngredientBuilder({ ingredients, setIngredients }: { ingredients: FormulaIngredientInput[]; setIngredients: (next: FormulaIngredientInput[]) => void }) {
  const materialsQuery = useListMaterials();
  const materials = materialsQuery.data ?? [];
  const add = () => setIngredients([...ingredients, { materialId: materials[0]?.id ?? 0, materialName: materials[0]?.name ?? "", percentage: 0, grams: 0, role: "heart" }]);
  const update = (index: number, patch: Partial<FormulaIngredientInput>) => setIngredients(ingredients.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <div className="rounded-2xl border border-border bg-card p-6 sm:p-7"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The palette</p><h2 className="mt-1 font-display text-3xl">Materials in the blend</h2></div><Button onClick={add} variant="outline" testId="button-add-ingredient"><Plus size={14} /> Add material</Button></div><div className="mt-5 space-y-3">{ingredients.map((ingredient, index) => <div key={`${index}-${ingredient.materialId}`} className="grid gap-2 rounded-xl bg-secondary/60 p-3 sm:grid-cols-[1.6fr_.7fr_.7fr_30px]"><select value={ingredient.materialId} onChange={e => { const mat = materials.find(m => m.id === Number(e.target.value)); update(index, { materialId: Number(e.target.value), materialName: mat?.name ?? "" }); }} data-testid={`select-ingredient-material-${index}`} className="min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none"><option value={0}>Choose a material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input type="number" min="0" step=".1" value={ingredient.percentage} onChange={e => update(index, { percentage: Number(e.target.value) })} data-testid={`input-ingredient-percentage-${index}`} className="rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none" placeholder="%" /><select value={ingredient.role} onChange={e => update(index, { role: e.target.value as FormulaIngredientInput["role"] })} data-testid={`select-ingredient-role-${index}`} className="rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none"><option value="top">Top</option><option value="heart">Heart</option><option value="base">Base</option><option value="modifier">Modifier</option></select><button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))} data-testid={`button-remove-ingredient-${index}`} className="grid place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Minus size={15} /></button></div>)}{!ingredients.length && <div className="studio-grid rounded-xl p-8 text-center text-xs text-muted-foreground">No materials yet. Add the first thread.</div>}</div></div>;
}

function NewFormula() {
  const [, setLocation] = useLocation();
  const create = useCreateFormula();
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [brief, setBrief] = useState(""); const [concentration, setConcentration] = useState(20); const [totalMl, setTotalMl] = useState(30); const [notes, setNotes] = useState(""); const [ingredients, setIngredients] = useState<FormulaIngredientInput[]>([]);
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate({ data: { name, brief, status: "draft", concentration, totalMl, notes, ingredients } }, { onSuccess: formula => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation(`/formulas/${formula.id}`); } }); };
  return <Shell><PageHeader eyebrow="New page · formula" title="Make a beginning." description="A formula is a hypothesis. Give it a clear brief, then let the materials answer back." action={<Button href="/formulas" variant="quiet" testId="button-cancel-new">Cancel</Button>} /><form onSubmit={submit} className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><div className="space-y-5"><div className="rounded-2xl border border-border bg-card p-6 sm:p-7"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The intention</p><label className="mt-5 block text-xs font-semibold">Name<input required value={name} onChange={e => setName(e.target.value)} data-testid="input-formula-name" className="mt-2 w-full border-b border-border bg-transparent py-3 font-display text-3xl outline-none placeholder:text-muted-foreground/45 focus:border-accent" placeholder="A name with a little weather" /></label><label className="mt-7 block text-xs font-semibold">Creative brief<textarea required value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-formula-brief" className="mt-2 min-h-28 w-full resize-none rounded-xl border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-accent" placeholder="What should this scent make possible?" /></label><div className="mt-7 grid grid-cols-2 gap-4"><label className="text-xs font-semibold">Concentration %<input type="number" min="0" max="100" value={concentration} onChange={e => setConcentration(Number(e.target.value))} data-testid="input-formula-concentration" className="mt-2 w-full rounded-xl border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-accent" /></label><label className="text-xs font-semibold">Batch size ml<input type="number" min="0" value={totalMl} onChange={e => setTotalMl(Number(e.target.value))} data-testid="input-formula-total-ml" className="mt-2 w-full rounded-xl border border-border bg-secondary/45 px-3 py-3 text-sm outline-none focus:border-accent" /></label></div><label className="mt-7 block text-xs font-semibold">Notebook notes<textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-formula-notes" className="mt-2 min-h-24 w-full resize-none rounded-xl border border-border bg-secondary/45 p-4 text-sm leading-6 outline-none focus:border-accent" placeholder="Observations, references, things to remember..." /></label></div></div><div className="space-y-5"><IngredientBuilder ingredients={ingredients} setIngredients={setIngredients} /><div className="flex items-center justify-between rounded-2xl bg-[#edaa62] p-5 text-[#173d43]"><div><p className="font-display text-2xl">Keep it open.</p><p className="mt-1 text-xs opacity-70">You can revise every field once it’s in the library.</p></div><Button type="submit" disabled={create.isPending || !name || !brief} testId="button-save-formula">{create.isPending ? "Saving..." : "Save draft"} <ArrowUpRight size={15} /></Button></div>{create.isError && <p className="text-sm text-destructive" data-testid="status-create-error">Couldn’t save this formula. Try again.</p>}</div></form></Shell>;
}

function FormulaDetail() {
  const params = useParams<{ id: string }>(); const id = Number(params.id);
  const query = useGetFormula(id, { query: { enabled: Number.isFinite(id), queryKey: getGetFormulaQueryKey(id) } });
  const update = useUpdateFormula(); const remove = useDeleteFormula(); const qc = useQueryClient(); const [, setLocation] = useLocation();
  const formula = query.data; const [editing, setEditing] = useState(false); const [name, setName] = useState(""); const [brief, setBrief] = useState(""); const [notes, setNotes] = useState(""); const [status, setStatus] = useState<"draft" | "resting" | "approved" | "archived">("draft");
  const begin = () => { if (!formula) return; setName(formula.name); setBrief(formula.brief); setNotes(formula.notes ?? ""); setStatus(formula.status); setEditing(true); };
  const save = () => update.mutate({ id, data: { name, brief, notes, status } }, { onSuccess: result => { qc.setQueryData(getGetFormulaQueryKey(id), result); qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setEditing(false); } });
  const destroy = () => { if (window.confirm("Delete this formula from the library?")) remove.mutate({ id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListFormulasQueryKey() }); setLocation("/formulas"); } }); };
  if (query.isLoading) return <Shell><Skeleton className="h-72" /></Shell>;
  if (query.isError || !formula) return <Shell><ErrorState retry={() => query.refetch()} /></Shell>;
  return <Shell><PageHeader eyebrow={`Formula ${String(formula.id).padStart(3, "0")} · version ${formula.version}`} title={formula.name} description={formula.brief} action={<div className="flex gap-2"><Button onClick={begin} variant="outline" testId="button-edit-formula"><Settings2 size={14} /> Edit</Button><Button onClick={destroy} variant="quiet" testId="button-delete-formula"><Trash2 size={14} /></Button></div>} /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="space-y-6"><div className="rounded-2xl border border-border bg-card p-6 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Formula status</p><div className="mt-3 flex items-center gap-3"><StatusPill value={formula.status} /><StatusPill value={formula.safetyStatus} /><StatusPill value={formula.ifraStatus} /></div></div><div className="text-right"><p className="font-display text-4xl">{formula.concentration}%</p><p className="font-mono-ui text-[9px] uppercase text-muted-foreground">{formula.totalMl} ml batch</p></div></div></div><div className="rounded-2xl border border-border bg-card p-6 sm:p-7"><div className="flex items-end justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">The structure</p><h2 className="mt-1 font-display text-3xl">Ingredient map</h2></div><p className="font-mono-ui text-[10px] text-muted-foreground">{formula.ingredients.length} materials</p></div><div className="mt-5 space-y-1">{formula.ingredients.map((item, i) => <div key={`${item.materialId}-${i}`} data-testid={`row-ingredient-${item.materialId}`} className="grid grid-cols-[1fr_70px_70px] items-center gap-3 border-t border-border py-4"><div><p className="text-sm font-semibold">{item.materialName}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{item.role}</p></div><p className="text-right font-mono-ui text-xs">{item.percentage}%</p><p className="text-right font-mono-ui text-xs text-muted-foreground">{item.grams}g</p></div>)}</div></div>{editing && <div className="fixed inset-0 z-40 grid place-items-center bg-primary/35 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Edit formula</p><h2 className="mt-1 font-display text-3xl">Stay curious.</h2></div><button onClick={() => setEditing(false)} data-testid="button-close-edit"><X size={18} /></button></div><label className="mt-7 block text-xs font-semibold">Name<input value={name} onChange={e => setName(e.target.value)} data-testid="input-edit-name" className="mt-2 w-full rounded-xl border border-border bg-secondary/45 px-4 py-3 text-sm outline-none focus:border-accent" /></label><label className="mt-4 block text-xs font-semibold">Brief<textarea value={brief} onChange={e => setBrief(e.target.value)} data-testid="textarea-edit-brief" className="mt-2 min-h-24 w-full rounded-xl border border-border bg-secondary/45 p-4 text-sm outline-none focus:border-accent" /></label><label className="mt-4 block text-xs font-semibold">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} data-testid="textarea-edit-notes" className="mt-2 min-h-24 w-full rounded-xl border border-border bg-secondary/45 p-4 text-sm outline-none focus:border-accent" /></label><div className="mt-6 flex justify-end gap-2"><Button onClick={() => setEditing(false)} variant="quiet" testId="button-cancel-edit">Cancel</Button><Button onClick={save} disabled={update.isPending} testId="button-update-formula">{update.isPending ? "Updating..." : "Save changes"}</Button></div></div></div>}</section><aside className="space-y-6"><div className="rounded-2xl bg-primary p-6 text-primary-foreground"><ShieldCheck size={20} className="text-[#edaa62]" /><p className="mt-5 font-display text-3xl">Safety, without the mood-kill.</p><p className="mt-3 text-sm leading-6 text-primary-foreground/65">Sillage keeps the guardrails visible so you can keep your attention on the shape of the scent.</p><div className="mt-6 space-y-2 border-t border-primary-foreground/15 pt-5 text-xs"><div className="flex justify-between"><span className="text-primary-foreground/60">Allergen notes</span><span data-testid="text-formula-allergens">{formula.allergenCount}</span></div><div className="flex justify-between"><span className="text-primary-foreground/60">Last touched</span><span>{new Date(formula.updatedAt).toLocaleDateString()}</span></div></div></div><div className="rounded-2xl border border-border bg-card p-6"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Notebook</p><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground" data-testid="text-formula-notes">{formula.notes || "No notes yet. Leave a trace for the next session."}</p></div></aside></div></Shell>;
}

function Coach() {
  const [message, setMessage] = useState(""); const [reply, setReply] = useState<{ reply: string; suggestions: string[]; cautions: string[] } | null>(null); const send = useSendCoachingMessage();
  const submit = (e: FormEvent) => { e.preventDefault(); if (!message.trim()) return; send.mutate({ data: { message, formulaId: null, formulaContext: null } }, { onSuccess: result => { setReply(result); setMessage(""); } }); };
  return <Shell><PageHeader eyebrow="Studio companion · the coach" title="Ask better questions." description="A thoughtful second nose for when the next move is just out of reach." /><div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><section className="min-h-[520px] rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="flex items-center gap-3 border-b border-border pb-5"><div className="grid size-10 place-items-center rounded-xl bg-[#edaa62] text-primary"><Sparkles size={19} /></div><div><p className="text-sm font-semibold">The perfumery coach</p><p className="text-xs text-muted-foreground">Creative direction, with a safety-aware eye</p></div></div>{reply ? <div className="animate-drift-in pt-8"><p className="font-display text-3xl leading-tight">{reply.reply}</p>{reply.suggestions.length > 0 && <div className="mt-8"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-muted-foreground">Try this next</p><ul className="mt-3 space-y-2">{reply.suggestions.map((suggestion, i) => <li key={i} data-testid={`text-coach-suggestion-${i}`} className="flex gap-2 rounded-xl bg-secondary/70 p-3 text-sm leading-5"><span className="font-mono-ui text-accent-foreground">0{i + 1}</span>{suggestion}</li>)}</ul></div>}{reply.cautions.length > 0 && <div className="mt-6 rounded-xl bg-[#f2dfb7] p-4 text-xs leading-5 text-[#755c27]"><p className="font-semibold">Keep in mind</p>{reply.cautions.map((caution, i) => <p key={i}>{caution}</p>)}</div>}<button onClick={() => setReply(null)} data-testid="button-new-coach-question" className="mt-7 text-xs font-semibold text-accent-foreground hover:underline">Ask another question</button></div> : <div className="flex min-h-[340px] flex-col items-center justify-center text-center"><div className="relative mb-6 grid size-20 place-items-center rounded-full border border-dashed border-accent bg-[#f2dfb7] text-accent-foreground"><MessageCircle size={26} strokeWidth={1.3} /></div><p className="font-display text-3xl">What are you circling?</p><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">A difficult material, a flat drydown, a brief that won’t settle. Bring the unfinished thought.</p></div>}<form onSubmit={submit} className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-secondary/45 p-2"><input value={message} onChange={e => setMessage(e.target.value)} disabled={send.isPending} data-testid="input-coach-message" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" placeholder="I’m trying to make..." /><button type="submit" disabled={send.isPending || !message.trim()} data-testid="button-send-coach" className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40">{send.isPending ? <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> : <Send size={15} />}</button></form>{send.isError && <p className="mt-2 text-xs text-destructive" data-testid="status-coach-error">The coach couldn’t answer. Please try again.</p>}</section><aside className="rounded-2xl bg-[#d8e2cd] p-7 text-[#315c46]"><p className="font-mono-ui text-[9px] uppercase tracking-[.16em] opacity-65">Good prompts have texture</p><h2 className="mt-3 font-display text-4xl leading-none">Start with a sensation, not a solution.</h2><div className="mt-8 space-y-3">{["How do I make a clean musk feel less obvious?", "The opening is beautiful but disappears too fast.", "I want warmth without sweetness."].map((prompt, i) => <button key={prompt} onClick={() => setMessage(prompt)} data-testid={`button-prompt-${i}`} className="w-full rounded-xl border border-[#315c46]/15 bg-[#edf2e7]/60 p-4 text-left text-xs leading-5 transition-colors hover:bg-[#edf2e7]">{prompt}</button>)}</div></aside></div></Shell>;
}

function Landing() {
  return <div className="paper-grain min-h-[100dvh] overflow-hidden bg-background"><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-10"><Logo /><div className="flex items-center gap-2"><Button href="/sign-in" variant="quiet" testId="link-landing-sign-in">Sign in</Button><Button href="/sign-up" testId="link-landing-sign-up">Open the lab <ArrowUpRight size={14} /></Button></div></header><main><section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:pb-32"><div className="animate-drift-in"><p className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-accent-foreground">A creative perfumery workspace</p><h1 className="mt-6 max-w-3xl font-display text-[clamp(4rem,9vw,8.5rem)] leading-[.83] tracking-[-.045em]">Make the scent <em className="text-accent-foreground">stranger.</em></h1><p className="mt-9 max-w-lg text-base leading-7 text-muted-foreground">Sillage Lab is a focused studio for independent perfumers: keep the instinct, keep the record, keep formula safety close enough to trust.</p><div className="mt-9 flex flex-wrap items-center gap-3"><Button href="/sign-up" testId="button-landing-start">Start making <ArrowUpRight size={15} /></Button><span className="font-mono-ui text-[10px] text-muted-foreground">No blank canvases required.</span></div></div><div className="relative min-h-[420px] animate-drift-in lg:min-h-[540px]" style={{ animationDelay: ".18s" }}><div className="absolute inset-4 rotate-[-5deg] rounded-[32px] bg-primary shadow-2xl" /><div className="absolute inset-0 overflow-hidden rounded-[32px] bg-[#edaa62] p-8 text-primary"><div className="flex justify-between font-mono-ui text-[9px] uppercase tracking-[.16em]"><span>Field note 014</span><span>03.14</span></div><div className="absolute left-12 top-24 size-44 rounded-full border-[1px] border-primary/30" /><div className="absolute left-20 top-32 size-28 rounded-full border-[15px] border-primary/15" /><div className="absolute bottom-10 left-8 right-8"><p className="font-display text-6xl leading-[.82]">salt / iris<br /><em>old wood</em></p><div className="mt-7 flex items-end justify-between"><p className="max-w-[180px] text-xs leading-5 opacity-65">A little mineral. A soft refusal. Something that stays after the room is empty.</p><div className="grid size-20 place-items-center rounded-full border border-primary/30 font-mono-ui text-[9px] text-center uppercase leading-3">20%<br />eau de parfum</div></div></div></div></div></section><section className="border-y border-border bg-[#d8e2cd]"><div className="mx-auto grid max-w-7xl gap-0 sm:grid-cols-3"><div className="border-b border-border/60 p-8 sm:border-b-0 sm:border-r"><p className="font-mono-ui text-[10px] text-[#315c46]">01 / Notice</p><h2 className="mt-16 font-display text-3xl text-[#315c46]">Keep the brief close.</h2><p className="mt-3 text-sm leading-6 text-[#315c46]/70">A home for the feeling before the formula starts to behave.</p></div><div className="border-b border-border/60 p-8 sm:border-b-0 sm:border-r"><p className="font-mono-ui text-[10px] text-[#315c46]">02 / Wander</p><h2 className="mt-16 font-display text-3xl text-[#315c46]">Make room for odd.</h2><p className="mt-3 text-sm leading-6 text-[#315c46]/70">A material library and a coach that help you take the less obvious turn.</p></div><div className="p-8"><p className="font-mono-ui text-[10px] text-[#315c46]">03 / Return</p><h2 className="mt-16 font-display text-3xl text-[#315c46]">Trust the record.</h2><p className="mt-3 text-sm leading-6 text-[#315c46]/70">Safety context belongs beside the creative work, not in a separate room.</p></div></div></section><section className="mx-auto max-w-7xl px-5 py-24 sm:px-10"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">A studio practice</p><h2 className="mt-5 font-display text-5xl leading-[.9]">Precision can feel personal.</h2></div><div className="grid gap-6 sm:grid-cols-2"><div className="border-l-2 border-accent pl-5"><p className="text-sm font-semibold">Formula safety in the margin</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Allergens and IFRA status stay visible at the exact moment a choice is made.</p></div><div className="border-l-2 border-primary pl-5"><p className="text-sm font-semibold">A library that remembers</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Hold on to drafts, resting experiments, and the formula that finally clicked.</p></div></div></div></section></main><footer className="border-t border-border px-5 py-8 sm:px-10"><div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] text-muted-foreground"><span className="font-mono-ui uppercase tracking-[.14em]">Sillage Lab · for independent noses</span><span>Made for the long drydown.</span></div></footer></div>;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-background"><Skeleton className="h-8 w-32" /></div>;
  return isSignedIn ? <>{children}</> : <Redirect to="/sign-in" />;
}

function AuthPage({ kind }: { kind: "in" | "up" }) {
  return <div className="paper-grain grid min-h-[100dvh] place-items-center bg-primary px-4 py-10"><div className="absolute left-6 top-6 sm:left-10 sm:top-8"><Logo light /></div><div className="relative z-10 w-full max-w-[440px] rounded-3xl bg-[#f9f5eb] p-2 shadow-2xl">{kind === "in" ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /> : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}</div></div>;
}

function NotFoundView() {
  return <div className="paper-grain grid min-h-[100dvh] place-items-center bg-background p-6 text-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-accent-foreground">Page not found · 404</p><h1 className="mt-4 font-display text-6xl">A missing page.</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This page drifted out of the notebook. The rest of the studio is still here.</p><div className="mt-7"><Button href="/" testId="button-return-home">Return to the desk</Button></div></div></div>;
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: colors.teal, colorForeground: colors.ink, colorMutedForeground: "hsl(190 13% 42%)", colorBackground: "hsl(40 40% 98%)", colorInput: "hsl(37 34% 91%)", colorInputForeground: colors.ink, colorDanger: "hsl(2 58% 49%)", colorNeutral: "hsl(36 27% 84%)", fontFamily: "Plus Jakarta Sans", borderRadius: "1rem" }, elements: { cardBox: "bg-[#f9f5eb] rounded-3xl w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-[#173d43] font-semibold", headerSubtitle: "text-[#567074]", formFieldLabel: "text-[#173d43]", formFieldInput: "bg-[#f1ecdf] text-[#173d43]", formButtonPrimary: "bg-[#173d43] hover:bg-[#28545a]", footerActionLink: "text-[#b86d31]", socialButtonsBlockButtonText: "text-[#173d43]", dividerText: "text-[#567074]", footerActionText: "text-[#567074]" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Switch><Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} /><Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} /><Route path="/"><HomeRedirect /></Route><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/formulas/new"><Protected><NewFormula /></Protected></Route><Route path="/formulas/:id"><Protected><FormulaDetail /></Protected></Route><Route path="/formulas"><Protected><Formulas /></Protected></Route><Route path="/materials"><Protected><Materials /></Protected></Route><Route path="/coach"><Protected><Coach /></Protected></Route><Route><NotFoundView /></Route></Switch></WouterRouter></QueryClientProvider>
  </ClerkProvider>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Landing />;
  return isSignedIn ? <Redirect to="/dashboard" /> : <Landing />;
}