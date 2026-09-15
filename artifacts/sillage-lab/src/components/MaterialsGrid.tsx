import { Link } from "wouter";
import type { Material } from "@workspace/api-client-react";
import { MaterialCard } from "./MaterialCard";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";

export function MaterialsGrid({ materials, isLoading, isError, retry }: {
  materials: Material[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  if (isLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-56" />)}</div>;
  if (isError) return <ErrorState retry={retry} />;
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {materials.map((material) => <MaterialCard key={material.id} material={material} />)}
    {!materials.length && <div className="col-span-full">
      <div className="my-4 border border-border bg-secondary/30 py-16 text-center">
        <p className="mt-4 font-display text-3xl">No materials in that drawer.</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Try a different search term.</p>
        <div className="mt-6"><Button href="/materials" variant="outline" testId="button-empty-action">Clear search</Button></div>
      </div>
    </div>}
  </div>;
}
