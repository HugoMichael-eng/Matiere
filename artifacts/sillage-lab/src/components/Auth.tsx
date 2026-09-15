import type { ReactNode } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/react";
import { Redirect } from "wouter";
import { Logo } from "./Logo";
import { Skeleton } from "./Skeleton";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="grid min-h-[100dvh] place-items-center bg-background"><Skeleton className="h-8 w-32" /></div>;
  const destination = `${window.location.pathname}${window.location.search}`;
  return isSignedIn ? <>{children}</> : <Redirect to={`/sign-in?redirect=${encodeURIComponent(destination)}`} />;
}

export function AuthPage({ kind }: { kind: "in" | "up" }) {
  const BASE = import.meta.env.BASE_URL + "images/";
  const requestedDestination = new URLSearchParams(window.location.search).get("redirect");
  const safeDestination = requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//")
    ? requestedDestination
    : "/";
  const redirectUrl = `${basePath || ""}${safeDestination}`;
  const alternateAuthUrl = `${basePath}/${kind === "in" ? "sign-up" : "sign-in"}?redirect=${encodeURIComponent(safeDestination)}`;
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
            ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={alternateAuthUrl} fallbackRedirectUrl={redirectUrl} />
            : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={alternateAuthUrl} fallbackRedirectUrl={redirectUrl} />
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
