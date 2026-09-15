import {
  getGetFormulaQueryKey,
  useGetFormula,
} from "@workspace/api-client-react";

/** The formula detail query, kept as a thin cache-preserving wrapper. */
export function useFormula(id: number, enabled = Number.isFinite(id)) {
  return useGetFormula(id, {
    query: {
      enabled,
      queryKey: getGetFormulaQueryKey(id),
    },
  });
}