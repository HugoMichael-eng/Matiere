import { fetch } from 'expo/fetch';

type SSEEvent =
  | {
      type: 'user_message';
      message: {
        id: number;
        conversationId: number;
        role: string;
        content: string;
        createdAt: string;
      };
    }
  | { type: 'token'; token: string }
  | {
      type: 'done';
      message: {
        id: number;
        conversationId: number;
        role: string;
        content: string;
        createdAt: string;
      };
    }
  | { type: 'error'; error: string };

export interface StreamCallbacks {
  onUserMessage?: (msg: Extract<SSEEvent, { type: 'user_message' }>) => void;
  onToken: (token: string) => void;
  onDone: (msg: Extract<SSEEvent, { type: 'done' }>) => void;
  onError: (error: string) => void;
}

export async function streamConversationMessage(
  conversationId: number,
  message: string,
  formulaContext: string | null,
  authToken: string | null,
  callbacks: StreamCallbacks,
): Promise<void> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : '';

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/api/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ message, formulaContext: formulaContext || null }),
      },
    );
  } catch (err) {
    callbacks.onError('Network error. Please check your connection.');
    return;
  }

  if (!response.ok) {
    callbacks.onError(`Server error (${response.status}). Please try again.`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response body. Please try again.');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data) as SSEEvent;
          if (event.type === 'user_message') {
            callbacks.onUserMessage?.(event);
          } else if (event.type === 'token') {
            callbacks.onToken(event.token);
          } else if (event.type === 'done') {
            callbacks.onDone(event);
          } else if (event.type === 'error') {
            callbacks.onError(event.error);
          }
        } catch {
          // ignore parse errors on partial SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
