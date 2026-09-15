import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, X } from "lucide-react";
import { useSearch } from "wouter";
import type { StudioFile, FormulaFileAnalysis } from "../types/files";
import { FILE_ACCEPT, MAX_UPLOAD_BYTES, canAnalyzeFormulaFile as canAnalyzeImportedFile, fileSize as formatFileSize } from "../types/files";
import { ErrorState } from "../components/ErrorState";
import { PageHeader } from "../components/PageHeader";
import { SectionRule } from "../components/SectionRule";
import { Skeleton } from "../components/Skeleton";
import { Shell } from "../components/Shell";
import { FileCategoryIcon } from "../components/FileCategoryIcon";
import { FileUploadZone } from "../components/FileUploadZone";
import { FormulaImportReview } from "../components/FormulaImportReview";

export function FileDrawer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FormulaFileAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzingFileId, setAnalyzingFileId] = useState<number | null>(null);
  const search = useSearch();
  const autoAnalyzeId = Number(new URLSearchParams(search).get("analyze")) || null;
  const autoAnalyzedRef = useRef<number | null>(null);
  const filesQuery = useQuery({
    queryKey: ["studio-files"],
    queryFn: async (): Promise<StudioFile[]> => {
      const response = await fetch("/api/uploads", { credentials: "include" });
      if (!response.ok) throw new Error("Could not load your files.");
      return response.json();
    },
  });
  const deleteFile = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/uploads/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete this file.");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-files"] }),
  });
  const analyzeFile = useCallback(async (file: StudioFile) => {
    setAnalysisError(null);
    setAnalyzingFileId(file.id);
    try {
      const response = await fetch(`/api/uploads/${file.id}/analyze`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({})) as FormulaFileAnalysis & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "This file could not be analyzed.");
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "This file could not be analyzed.");
    } finally {
      setAnalyzingFileId(null);
    }
  }, []);

  useEffect(() => {
    if (!autoAnalyzeId || autoAnalyzedRef.current === autoAnalyzeId || !filesQuery.data) return;
    const file = filesQuery.data.find(item => item.id === autoAnalyzeId);
    if (!file) return;
    autoAnalyzedRef.current = autoAnalyzeId;
    if (canAnalyzeImportedFile(file)) void analyzeFile(file);
    else setAnalysisError(`${file.name} is saved in the drawer, but only JSON, CSV, text, and text-based PDF formula files can be turned into editable drafts.`);
  }, [analyzeFile, autoAnalyzeId, filesQuery.data]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(file => file.size > 0 && file.size <= MAX_UPLOAD_BYTES);
    const rejected = files.length - validFiles.length;
    setUploadError(rejected ? "Files must be between 1 byte and 25 MB." : null);
    if (!validFiles.length) return;

    setUploading(validFiles.map(file => file.name));
    for (const file of validFiles) {
      try {
        const requestResponse = await fetch("/api/uploads/request-url", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
        });
        if (!requestResponse.ok) {
          const data = await requestResponse.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not prepare this upload.");
        }
        const requested = await requestResponse.json() as { uploadUrl: string; objectKey: string; category: StudioFile["category"] };
        const stored = await fetch(requested.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!stored.ok) throw new Error("The file could not be saved to storage.");

        const completeResponse = await fetch("/api/uploads", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            objectKey: requested.objectKey,
            category: requested.category,
          }),
        });
        if (!completeResponse.ok) throw new Error("The upload finished, but could not be added to your file drawer.");
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "This upload could not be completed.");
      } finally {
        setUploading(current => current.filter(name => name !== file.name));
      }
    }
    qc.invalidateQueries({ queryKey: ["studio-files"] });
  }, [qc]);

  return (
    <Shell>
      <PageHeader eyebrow="Studio archive" title="File drawer" description="Keep formula exports, evaluation photos, supplier sheets, and every useful reference close to the work." />
      <section className="py-8">
        <FileUploadZone inputRef={inputRef} isDragging={isDragging} uploading={uploading} uploadError={uploadError} onUpload={files => void uploadFiles(files)} onDraggingChange={setIsDragging} />
      </section>

      <SectionRule label="Saved files" />
      {analysisError && <div className="mb-4 flex items-start justify-between gap-4 border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive" data-testid="status-file-analysis-error"><span>{analysisError}</span><button onClick={() => setAnalysisError(null)} aria-label="Dismiss file analysis error"><X size={14} /></button></div>}
      {filesQuery.isLoading ? (
        <div className="space-y-px border border-border">{[1, 2, 3].map(item => <Skeleton key={item} className="h-20 w-full" />)}</div>
      ) : filesQuery.isError ? <ErrorState retry={() => filesQuery.refetch()} /> : filesQuery.data?.length ? (
        <div className="border border-border bg-card">
          {filesQuery.data.map((file, index) => (
            <div key={file.id} className={`group flex items-center gap-4 px-5 py-4 ${index ? "border-t border-border" : ""}`}>
              <div className="grid size-10 shrink-0 place-items-center border border-border bg-secondary/30 text-muted-foreground"><FileCategoryIcon category={file.category} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="mt-1 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground">{file.category} · {formatFileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
               {canAnalyzeImportedFile(file) && <button
                 onClick={() => void analyzeFile(file)}
                 disabled={analyzingFileId === file.id}
                 className="shrink-0 border border-border px-3 py-2 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                 data-testid={`button-analyze-file-${file.id}`}
               >{analyzingFileId === file.id ? "Reading…" : "Analyze & draft"}</button>}
              <a href={`/api/uploads/${file.id}/download`} className="grid size-9 place-items-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={`Download ${file.name}`} data-testid={`button-download-file-${file.id}`}><Download size={15} strokeWidth={1.5} /></a>
              <button
                onClick={() => {
                  if (window.confirm(`Delete “${file.name}”? This cannot be undone.`)) deleteFile.mutate(file.id);
                }}
                disabled={deleteFile.isPending}
                className="grid size-9 place-items-center text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${file.name}`}
                data-testid={`button-delete-file-${file.id}`}
              ><Trash2 size={14} strokeWidth={1.5} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-3xl">Nothing filed yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start with a formula export, a reference image, or the evaluation notes from your last trial.</p>
        </div>
      )}
      {analysis && <FormulaImportReview key={analysis.sourceFile} analysis={analysis} onClose={() => setAnalysis(null)} />}
    </Shell>
  );
}

export default FileDrawer;
