import { useListMaterials } from "@workspace/api-client-react";

export function useMaterials(search?: string) {
  return useListMaterials(search ? { search } : undefined);
}