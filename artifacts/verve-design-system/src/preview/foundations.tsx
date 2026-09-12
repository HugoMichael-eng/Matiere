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
import { Guidelines } from './parts';

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
  { label: 'Display', className: 'font-serif text-4xl font-black uppercase tracking-[-0.04em]' },
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
      <div className={`h-16 rounded-lg ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden border bg-background px-6 py-12 text-foreground sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
          {[0, 1, 2, 3].map((line) => <div key={line} className="border-r border-foreground/10" />)}
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            MATIÈRE / FROM WORLD TO SCENT
          </p>
          <h1 className="mt-8 font-serif text-[clamp(4rem,14vw,10rem)] font-black uppercase leading-[0.72] tracking-[-0.06em]">
            See
            <span
              className="relative block text-right text-transparent"
              style={{ WebkitTextStroke: '1.5px hsl(var(--foreground))' }}
            >
              Smell
              <span className="absolute -right-1 top-2 h-4 w-4 bg-accent [-webkit-text-stroke:0]" aria-hidden="true" />
            </span>
          </h1>
          <p className="ml-auto mt-10 max-w-lg text-xl font-bold leading-tight tracking-[-0.02em]">
            Visual culture, material research, olfactive thinking, and technical formulation in one continuous creative process.
          </p>
        </div>
      </section>

      <section className="grid border bg-card text-card-foreground md:grid-cols-3">
        {[
          ['Gallery', 'Atmospheric, image-led, spatial, and expressive.'],
          ['Studio', 'Warm, tactile, editorial, open, and thoughtful.'],
          ['Laboratory', 'Pale, precise, calm, compact, and information-rich.'],
        ].map(([name, description], index) => (
          <div key={name} className="border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
            <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
            <h2 className="mt-10 font-serif text-3xl font-bold tracking-[-0.04em]">{name}</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Typography
          </h2>
          <div className="mt-4 space-y-3">
            {TYPE_SCALE.map((entry) => (
              <p key={entry.label} className={entry.className}>
                {entry.label}
              </p>
            ))}
          </div>
        </section>

        <section className="border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In use
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Create workspace</CardTitle>
              <CardDescription>
                Components composed from the tokens above.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">Workspace name</Label>
                <Input id="overview-name" placeholder="Enter a name" />
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked id="overview-notify" />
                <Label htmlFor="overview-notify">Email notifications</Label>
                <Badge className="ml-auto">New</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Enter canvas →</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="grid gap-6 border bg-card p-5 text-card-foreground lg:grid-cols-2">
        <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
        </div>
        <div>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Principles</h2>
          <Guidelines items={[
            { kind: 'do', text: 'Use oversized display typography as the dominant visual event.' },
            { kind: 'do', text: 'Move coherently between atmospheric Gallery, tactile Studio, and precise Laboratory environments.' },
            { kind: 'do', text: 'Use acid citron only for active states, selections, connections, drag targets, AI markers, and focus.' },
            { kind: 'dont', text: 'Reduce creative work to repeated cards, rigid dashboards, or generic SaaS patterns.' },
          ]} />
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
      <Guidelines items={[
        { kind: 'do', text: 'Let warm gallery whites, bone, chalk, plaster, and mineral grey carry most surfaces.' },
        { kind: 'do', text: 'Reserve true black for focus states, cinematic imagery, deep overlays, and atmospheric transitions.' },
        { kind: 'dont', text: 'Let acid citron exceed a small, deliberate portion of the interface.' },
      ]} />

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
  return (
    <div className="space-y-8 border bg-card p-6 text-card-foreground">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Font family
        </h2>
        <p className="mt-4 font-serif text-6xl font-black uppercase leading-none tracking-[-0.05em]">Form follows brutal function.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The token font family is applied across this entire preview.
        </p>
      </section>
      <Guidelines items={[
        { kind: 'do', text: 'Pair very large Bricolage Grotesque display lines with compact Inter labels and copy.' },
        { kind: 'do', text: 'Use IBM Plex Mono selectively for formula values, material data, versions, and dates.' },
        { kind: 'dont', text: 'Make every label uppercase with wide tracking; creative language should breathe naturally.' },
      ]} />

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Type scale
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[88px_1fr]">
            <span className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Build products people understand.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border bg-card p-6 text-card-foreground">
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
              <div className={`h-3 bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="border bg-card p-6 text-card-foreground">
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
