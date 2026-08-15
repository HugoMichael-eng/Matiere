import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';

const CORE_SWATCHES = [
  { name: 'Primary', className: 'bg-primary' },
  { name: 'Secondary', className: 'bg-secondary' },
  { name: 'Accent', className: 'bg-accent' },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Background', className: 'border bg-background' },
  { name: 'Foreground', className: 'bg-foreground' },
  { name: 'Muted', className: 'bg-muted' },
  { name: 'Destructive', className: 'bg-destructive' },
  { name: 'Border', className: 'bg-border' },
] as const;

const TYPE_SCALE = [
  { label: 'Display', className: 'text-4xl font-bold' },
  { label: 'Heading', className: 'text-2xl font-semibold' },
  { label: 'Body', className: 'text-base' },
  { label: 'Label', className: 'text-sm font-medium' },
  { label: 'Caption', className: 'text-sm text-muted-foreground' },
] as const;

const SPACING_SCALE = [
  { label: '4', className: 'w-4' },
  { label: '8', className: 'w-8' },
  { label: '12', className: 'w-12' },
  { label: '16', className: 'w-16' },
  { label: '24', className: 'w-24' },
] as const;

function Swatch({
  name,
  className,
}: {
  name: string;
  className: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Editorial hero — single typeface, weight contrast */}
      <section className="border bg-foreground p-8 text-background">
        <p className="font-sans text-[10px] uppercase tracking-[.25em] text-background/40">S2 · Editorial Void</p>
        <h1 className="mt-3 font-sans text-6xl font-thin leading-[.85] tracking-tight">
          The materials<br />answer back.
        </h1>
        <p className="mt-5 font-sans text-sm font-normal text-background/60 max-w-sm leading-6">
          One typeface. Extreme weight contrast. No decoration — only precision.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="border-background/20 text-background hover:bg-background/10">Explore</Button>
          <span className="flex items-center px-3 font-sans text-[10px] uppercase tracking-widest text-background/30">Zero radius · One typeface · One accent</span>
        </div>
      </section>

      {/* Core palette */}
      <section className="border bg-card p-5 text-card-foreground">
        <h2 className="text-[10px] font-medium uppercase tracking-[.2em] text-muted-foreground">
          Core palette
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weight contrast */}
        <section className="border bg-card p-5 text-card-foreground">
          <h2 className="text-[10px] font-medium uppercase tracking-[.2em] text-muted-foreground">
            Weight contrast
          </h2>
          <div className="mt-5 space-y-3">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">100 — Display</p>
              <p className="font-sans text-4xl font-thin leading-none">Matière</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">400 — Body</p>
              <p className="font-sans text-base font-normal">The quick brown fox jumps over the lazy dog.</p>
            </div>
            <div className="border-t pt-3">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">700 — Emphasis</p>
              <p className="font-sans text-sm font-bold uppercase tracking-widest">Studio desk</p>
            </div>
          </div>
        </section>

        {/* In use */}
        <section className="border bg-card p-5 text-card-foreground">
          <h2 className="text-[10px] font-medium uppercase tracking-[.2em] text-muted-foreground">
            In use
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>New formula</CardTitle>
              <CardDescription>Components from the tokens above.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">Formula name</Label>
                <Input id="overview-name" placeholder="A name with a little weather" />
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked id="overview-notify" />
                <Label htmlFor="overview-notify">Save to library</Label>
                <Badge className="ml-auto">Draft</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Save draft</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* Component strip */}
      <section className="space-y-4 border bg-card p-5 text-card-foreground">
        <h2 className="text-[10px] font-medium uppercase tracking-[.2em] text-muted-foreground">
          Components
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 border bg-card p-6 text-card-foreground">
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Brand colors</h2>
          <p className="text-sm text-muted-foreground">
            The core roles used for emphasis, supporting actions, and accents.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Semantic and surface colors</h2>
          <p className="text-sm text-muted-foreground">
            Roles for text, backgrounds, borders, muted content, and danger.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SUPPORTING_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FontsPage() {
  const WEIGHTS = [
    { w: '100', label: 'Thin' },
    { w: '200', label: 'ExtraLight' },
    { w: '300', label: 'Light' },
    { w: '400', label: 'Regular' },
    { w: '500', label: 'Medium' },
    { w: '600', label: 'SemiBold' },
    { w: '700', label: 'Bold' },
    { w: '800', label: 'ExtraBold' },
    { w: '900', label: 'Black' },
  ] as const;

  return (
    <div className="space-y-6 border bg-card p-6 text-card-foreground">
      {/* Specimen */}
      <section>
        <p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground">Jost — The only typeface</p>
        <p className="mt-4 font-sans text-[80px] font-thin leading-none tracking-tight">Aa</p>
        <p className="mt-4 font-sans text-xl font-light leading-snug">
          Geometric grotesque. Futura-inspired precision.<br />One typeface, nine weights, infinite contrast.
        </p>
        <p className="mt-2 font-sans text-sm text-muted-foreground">
          All roles — display, body, UI, labels — use Jost. Weight and scale create the hierarchy.
        </p>
      </section>

      <div className="border-t" />

      {/* Weight ramp */}
      <section>
        <p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground mb-4">Weight ramp</p>
        <div className="space-y-3">
          {WEIGHTS.map(({ w, label }) => (
            <div key={w} className="flex items-baseline gap-6">
              <span className="w-24 shrink-0 font-sans text-[9px] uppercase tracking-widest text-muted-foreground">{w} {label}</span>
              <p className="font-sans text-2xl leading-none" style={{ fontWeight: w }}>The quick brown fox</p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t" />

      {/* Type scale */}
      <section className="space-y-4">
        <p className="text-[9px] uppercase tracking-[.25em] text-muted-foreground">Scale in use</p>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[88px_1fr]">
            <span className="pt-1 text-[9px] uppercase tracking-widest text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Every edge is a statement.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Spacing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The spacing scale, derived from the base spacing token.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-8 text-xs text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Corner treatments derive from the base radius token.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small', className: 'rounded-sm' },
            { label: 'Medium', className: 'rounded-md' },
            { label: 'Large', className: 'rounded-lg' },
            { label: 'Extra large', className: 'rounded-xl' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-24 items-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="text-xs font-medium">{radius.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
