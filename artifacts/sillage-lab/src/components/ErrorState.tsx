import { CircleAlert } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="border border-destructive/30 bg-destructive/5 p-8 text-center">
      <CircleAlert className="mx-auto text-destructive" />
      <p className="mt-3 font-display text-2xl">The studio is quiet.</p>
      <p className="mt-1 text-sm text-muted-foreground">We couldn't read your workspace just now.</p>
      <div className="mt-4"><Button onClick={retry} variant="outline" testId="button-retry">Try again</Button></div>
    </div>
  );
}