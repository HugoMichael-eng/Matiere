import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Paperclip } from "lucide-react";
import type { StudioFile } from "../types/files";
import { FILE_ACCEPT } from "../types/files";
import { canAnalyzeFormulaFile } from "../types/files";
import { uploadStudioFile } from "../lib/files";
import { Button } from "./Button";

export function FormulaToolFileUpload({ testId }: { testId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [saved, setSaved] = useState<StudioFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const selectFile = async (file: File) => {
    setStatus(null);
    setSaved(null);
    setIsUploading(true);
    try {
      const fileRecord = await uploadStudioFile(file);
      setSaved(fileRecord);
      qc.invalidateQueries({ queryKey: ["studio-files"] });
      setStatus(canAnalyzeFormulaFile(fileRecord)
        ? "Formula source filed. Review it before making the editable draft."
        : "Reference filed. It is available in your File Drawer and Creative Lab.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "This file could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="text-right">
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        data-testid={`${testId}-input`}
        onChange={event => {
          const [file] = Array.from(event.target.files ?? []);
          if (file) void selectFile(file);
          event.target.value = "";
        }}
      />
      <Button onClick={() => inputRef.current?.click()} variant="outline" disabled={isUploading} testId={testId}>
        <Paperclip size={13} /> {isUploading ? "Filing…" : "Upload a file"}
      </Button>
      {status && <p className={`mt-2 max-w-xs text-xs leading-5 ${saved ? "text-muted-foreground" : "text-destructive"}`} data-testid={`${testId}-status`}>{status}</p>}
      {saved && <Link href={canAnalyzeFormulaFile(saved) ? `/files?analyze=${saved.id}` : "/files"} className="mt-2 inline-block text-[10px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid={`${testId}-review`}>
        {canAnalyzeFormulaFile(saved) ? "Review & make draft ↗" : "Open File Drawer ↗"}
      </Link>}
    </div>
  );
}
