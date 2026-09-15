import type { RefObject } from "react";
import { Upload } from "lucide-react";
import { FILE_ACCEPT } from "../types/files";

export function FileUploadZone({ inputRef, isDragging, uploading, uploadError, onUpload, onDraggingChange }: {
  inputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  uploading: string[];
  uploadError: string | null;
  onUpload: (files: File[]) => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  return <>
    <input ref={inputRef} type="file" className="sr-only" accept={FILE_ACCEPT} multiple onChange={event => { onUpload(Array.from(event.target.files ?? [])); event.target.value = ""; }} data-testid="input-file-upload" />
    <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }} onDragOver={event => { event.preventDefault(); onDraggingChange(true); }} onDragLeave={event => { if (event.currentTarget === event.target) onDraggingChange(false); }} onDrop={event => { event.preventDefault(); onDraggingChange(false); onUpload(Array.from(event.dataTransfer.files)); }} className={`group grid cursor-pointer place-items-center border px-6 py-14 text-center transition-colors ${isDragging ? "border-foreground bg-secondary/40" : "border-dashed border-border bg-secondary/15 hover:border-foreground/40 hover:bg-secondary/30"}`} data-testid="dropzone-file-upload" aria-label="Upload files">
      <div className="grid size-12 place-items-center border border-border bg-background transition-transform duration-200 group-hover:-translate-y-0.5"><Upload size={18} strokeWidth={1.5} /></div>
      <p className="mt-5 font-display text-3xl">Add to the drawer.</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Drop files here or browse. Formula exports, photos, PDFs, spreadsheets, and studio notes are all welcome.</p>
      <p className="mt-4 font-mono-ui text-[8px] uppercase tracking-[.18em] text-muted-foreground/70">Images · PDF · CSV · JSON · Word · Excel · text · 25 MB each</p>
    </div>
    {(uploading.length > 0 || uploadError) && <div className="mt-4 border border-border bg-card px-5 py-4">{uploading.map(name => <p key={name} className="flex items-center gap-2 text-sm"><span className="size-2 animate-pulse bg-foreground" /> Uploading {name}…</p>)}{uploadError && <p className="text-sm text-destructive">{uploadError}</p>}</div>}
  </>;
}
