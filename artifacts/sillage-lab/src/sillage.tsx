import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { experimental__simple } from "@clerk/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Route, Switch, Router as WouterRouter } from "wouter";
import { Shell } from "./components/Shell";
import { Protected, AuthPage } from "./components/Auth";

const Landing = lazy(() => import("./pages/Landing"));
const PublicExample = lazy(() => import("./pages/PublicExample").then(module => ({ default: module.PublicExample })));
const Studio = lazy(() => import("./pages/Studio").then(module => ({ default: module.Studio })));
const Inspiration = lazy(() => import("./pages/Inspiration").then(module => ({ default: module.Inspiration })));
const ProjectWorkspace = lazy(() => import("./pages/ProjectWorkspace").then(module => ({ default: module.ProjectWorkspace })));
const Projects = lazy(() => import("./pages/Projects").then(module => ({ default: module.Projects })));
const NewFormula = lazy(() => import("./pages/NewFormula"));
const FormulaDetail = lazy(() => import("./pages/FormulaDetail"));
const Formulas = lazy(() => import("./pages/Formulas"));
const MaterialDetail = lazy(() => import("./pages/MaterialDetail").then(module => ({ default: module.MaterialDetail })));
const Materials = lazy(() => import("./pages/Materials"));
const FileDrawer = lazy(() => import("./pages/FileDrawer"));
const Coach = lazy(() => import("./pages/Coach"));
const Shop = lazy(() => import("./pages/Shop"));
const NotFoundView = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function RoutedProtected({ children }: { children: ReactNode }) {
  return <Protected>{children}</Protected>;
}

export function SillageApp() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={{ theme: experimental__simple, options: { logoPlacement: "inside", logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` }, variables: { colorPrimary: "hsl(var(--primary))", colorForeground: "hsl(var(--foreground))", colorMutedForeground: "hsl(var(--muted-foreground))", colorBackground: "hsl(var(--background))", colorInput: "hsl(var(--input))", colorInputForeground: "hsl(var(--foreground))", colorDanger: "hsl(var(--destructive))", colorNeutral: "hsl(var(--border))", fontFamily: "Inter", borderRadius: "0rem" }, elements: { cardBox: "bg-card border border-border w-[440px] max-w-full", card: "!shadow-none !border-0 !bg-transparent", footer: "!shadow-none !border-0 !bg-transparent", headerTitle: "text-foreground font-medium", headerSubtitle: "text-muted-foreground", formFieldLabel: "text-foreground", formFieldInput: "bg-secondary text-foreground border border-border", formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-80 rounded-none uppercase tracking-widest text-[11px]", footerActionLink: "text-foreground underline", socialButtonsBlockButtonText: "text-foreground", socialButtonsBlockButton__google: "!hidden", dividerRow: "!hidden", dividerText: "text-muted-foreground", footerActionText: "text-muted-foreground" } }} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Return to the studio", subtitle: "Your next idea is still on the page." } }, signUp: { start: { title: "Open your studio", subtitle: "A place for the work between first thought and final blotter." } } }}>
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
         <Suspense fallback={<div role="status" aria-live="polite" className="grid min-h-[100dvh] place-items-center bg-background p-6 font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Loading studio…</div>}>
         <Switch>
          <Route path="/sign-in/*?" component={() => <AuthPage kind="in" />} />
          <Route path="/sign-up/*?" component={() => <AuthPage kind="up" />} />
          <Route path="/"><Landing /></Route>
          <Route path="/example"><PublicExample /></Route>
          <Route path="/dashboard"><Redirect to="/studio" /></Route>
          <Route path="/studio"><RoutedProtected><Shell><Studio /></Shell></RoutedProtected></Route>
          <Route path="/projects/:id/inspiration"><RoutedProtected><Shell><Inspiration /></Shell></RoutedProtected></Route>
          <Route path="/projects/:id"><RoutedProtected><Shell><ProjectWorkspace /></Shell></RoutedProtected></Route>
          <Route path="/projects"><RoutedProtected><Shell><Projects /></Shell></RoutedProtected></Route>
          <Route path="/formulas/new"><RoutedProtected><NewFormula /></RoutedProtected></Route>
          <Route path="/formulas/:id"><RoutedProtected><FormulaDetail /></RoutedProtected></Route>
          <Route path="/formulas"><RoutedProtected><Formulas /></RoutedProtected></Route>
          <Route path="/materials/:id"><RoutedProtected><Shell><MaterialDetail /></Shell></RoutedProtected></Route>
          <Route path="/materials"><RoutedProtected><Materials /></RoutedProtected></Route>
          <Route path="/files"><RoutedProtected><FileDrawer /></RoutedProtected></Route>
          <Route path="/coach"><RoutedProtected><Coach /></RoutedProtected></Route>
          <Route path="/shop"><RoutedProtected><Shop /></RoutedProtected></Route>
          <Route><NotFoundView /></Route>
         </Switch>
         </Suspense>
      </WouterRouter>
    </QueryClientProvider>
  </ClerkProvider>;
}
