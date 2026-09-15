import { LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { Logo } from "./Logo";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const navItems = [
  { href: "/studio", label: "Studio" },
  { href: "/projects", label: "Projects" },
  { href: "/formulas", label: "Formulas" },
  { href: "/materials", label: "Materials" },
];

export function Sidebar() {
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
            <Link href={href} key={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`} className={[
              "flex items-center gap-3 py-2.5 font-mono-ui text-[9px] tracking-[.22em] uppercase transition-colors duration-150",
              "focus-visible:outline-none",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}>
              {active ? <span className="h-[1px] w-3 bg-accent shrink-0" aria-hidden /> : <span className="h-[1px] w-3 shrink-0" aria-hidden />}
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="border-t border-border pt-5">
          <p className="truncate font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground">{user?.firstName ?? "Studio"}</p>
          <button onClick={() => signOut({ redirectUrl: `${basePath || ""}/` })} data-testid="button-sign-out" className="mt-3 font-mono-ui text-[8px] uppercase tracking-[.14em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2" aria-label="Sign out">
            <LogOut size={10} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}