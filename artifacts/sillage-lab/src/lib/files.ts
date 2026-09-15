import type { StudioFile } from "../types/files";
import { MAX_UPLOAD_BYTES } from "../types/files";

export async function uploadStudioFile(file: File): Promise<StudioFile> {
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new Error("Choose a file between 1 byte and 25 MB.");
  const requestResponse = await fetch("/api/uploads/request-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
  });
  const requested = await requestResponse.json().catch(() => ({})) as { uploadUrl?: string; objectKey?: string; category?: StudioFile["category"]; error?: string };
  if (!requestResponse.ok || !requested.uploadUrl || !requested.objectKey || !requested.category) throw new Error(requested.error ?? "Could not prepare this upload.");

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
  const saved = await completeResponse.json().catch(() => ({})) as StudioFile & { error?: string };
  if (!completeResponse.ok || !saved.id) throw new Error(saved.error ?? "The upload finished, but could not be added to your file drawer.");
  return saved;
}
