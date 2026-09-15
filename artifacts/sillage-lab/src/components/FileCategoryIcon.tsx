import { File, FileImage, FileText, FlaskConical } from "lucide-react";
import type { StudioFile } from "../types/files";

export function FileCategoryIcon({ category }: { category: StudioFile["category"] }) {
  const Icon = category === "image" ? FileImage : category === "formula" ? FlaskConical : category === "document" ? FileText : File;
  return <Icon size={17} strokeWidth={1.5} />;
}
