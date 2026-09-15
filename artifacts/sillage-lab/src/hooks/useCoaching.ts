import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetConversationQueryKey,
  getGetFormulaQueryKey,
  useCreateConversation,
  useDeleteConversation,
  useGetConversation,
  useGetFormula,
  useListConversations,
  useListMaterials,
} from "@workspace/api-client-react";
import { useStreamMessage } from "./useStreamMessage";

/**
 * Owns the coach's session/query primitives. The page remains responsible for
 * presentation and the streaming side effects that connect those primitives.
 */
export function useCoaching({ formulaId, conversationId }: { formulaId: number | null; conversationId: number | null }) {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(conversationId);
  const formulaQuery = useGetFormula(formulaId ?? 0, {
    query: { enabled: !!formulaId && Number.isFinite(formulaId), queryKey: getGetFormulaQueryKey(formulaId ?? 0) },
  });
  const conversationsQuery = useListConversations();
  const conversationQuery = useGetConversation(selectedConversationId ?? 0, {
    query: {
      enabled: !!selectedConversationId,
      queryKey: getGetConversationQueryKey(selectedConversationId ?? 0),
    },
  });
  const materialsQuery = useListMaterials();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const streamMessage = useStreamMessage();
  const [newTitle, setNewTitle] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("matiere-pinned-sessions") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  const togglePin = useCallback((id: number) => {
    setPinnedIds(previous => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("matiere-pinned-sessions", JSON.stringify([...next]));
      return next;
    });
  }, []);

  return {
    queryClient,
    formulaQuery,
    activeFormula: formulaQuery.data ?? null,
    conversationsQuery,
    conversations: conversationsQuery.data ?? [],
    conversationQuery,
    activeConversation: conversationQuery.data,
    materialsQuery,
    libraryMaterials: materialsQuery.data ?? [],
    createConversation,
    deleteConversation,
    streamMessage,
    selectedConversationId,
    setSelectedConversationId,
    newTitle,
    setNewTitle,
    creatingNew,
    setCreatingNew,
    message,
    setMessage,
    sessionSearch,
    setSessionSearch,
    pinnedIds,
    togglePin,
  };
}