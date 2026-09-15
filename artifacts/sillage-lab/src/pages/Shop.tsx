import { PageHeader } from "../components/PageHeader";
import { Shell } from "../components/Shell";
import { ArrowUpRight } from "lucide-react";
export function Shop() {
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

export default Shop;
