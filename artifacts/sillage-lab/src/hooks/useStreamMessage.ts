import { useAuth } from "@clerk/react";
import { useCallback, useRef, useState } from "react";

export type StreamMessage = {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
};

export function useStreamMessage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const { getToken } = useAuth();
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (
    conversationId: number,
    data: { message: string; formulaContext?: string | null },
    callbacks: {
      onUserMessage?: (msg: StreamMessage) => void;
      onDone?: (msg: StreamMessage) => void;
      onError?: (err: string) => void;
    } = {},
  ) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setIsPending(true);
    setError(null);
    setStreamingContent("");

    try {
      const token = await getToken();
      const response = await fetch(`/api/conversations/${conversationId}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal: ac.signal,
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let evt: { type: string; message?: StreamMessage; token?: string; error?: string } | null = null;
          try {
            evt = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (!evt) continue;
          if (evt.type === "user_message") {
            callbacks.onUserMessage?.(evt.message as StreamMessage);
          } else if (evt.type === "token") {
            setStreamingContent((prev) => (prev ?? "") + (evt.token as string));
          } else if (evt.type === "done") {
            callbacks.onDone?.(evt.message as StreamMessage);
          } else if (evt.type === "error") {
            throw new Error(evt.error ?? "Server error");
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = (err instanceof Error ? err.message : null) ?? "Something went wrong";
      callbacks.onError?.(message);
      setError(message);
    } finally {
      setIsPending(false);
      setStreamingContent(null);
    }
  }, [getToken]);

  return { send, isPending, error, streamingContent };
}