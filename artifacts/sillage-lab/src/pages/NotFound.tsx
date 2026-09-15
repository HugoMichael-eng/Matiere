import { Button } from "../components/Button";
export function NotFoundView() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-6 text-center">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Page not found · 404</p>
        <h1 className="mt-4 font-display text-6xl">A missing page.</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">This page drifted out of the notebook.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Button href="/" testId="button-return-home">Return to MATIÈRE</Button></div>
      </div>
    </div>
  );
}
export default NotFoundView;
