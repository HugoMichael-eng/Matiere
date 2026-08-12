import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Droplet, Send, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  isStreaming?: boolean;
};

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    time: "10:02",
    content:
      "I'm testing a new woody-amber base with 8% Iso E Super. Contrast feels flat after 30 minutes — any structural fixes?",
  },
  {
    id: "m2",
    role: "assistant",
    time: "10:02",
    content:
      "Flat contrast usually means your top and heart materials are decaying at a similar rate to the base. Try layering a sharper aldehydic or citrus top at a lower dosage so it fades faster, and lean into a resinous or animalic note in the heart to widen the gap before the base takes over.",
  },
  {
    id: "m3",
    role: "user",
    time: "10:05",
    content: "Would labdanum work better than benzoin here for that resin note?",
  },
  {
    id: "m4",
    role: "assistant",
    time: "10:06",
    content:
      "Labdanum is the stronger move — it brings a leathery, ambery depth that plays well against Iso E Super without competing for the same 'soft musk' space benzoin occupies. Start around 3-4% and evaluate at the 2-hour mark.",
  },
];

/**
 * Split-panel layout — a structural variation on the threaded log. Instead of
 * a single scrolling column with the formula context tucked behind a
 * slide-in sheet, this composition permanently splits the screen into two
 * fixed regions: a left context rail (session facts + formula notes, always
 * visible, never overlaying the log) and a right conversation pane that
 * reverts to classic left/right aligned bubbles with per-message timestamps.
 * Visual weight shifts from "one dominant column" to "two co-equal columns",
 * and hierarchy within the log is rebuilt around alignment + color instead
 * of avatar/name headers.
 */
export default function ChatSplitPanelLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [formulaContext, setFormulaContext] = useState(
    "Base: Iso E Super 8%, Ambroxan 4%, Cedramber 3%",
  );
  const [isLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messageCount = useMemo(() => messages.length, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const tempUserMsg: ChatMessage = {
      id: "opt-user-" + Date.now().toString() + Math.random().toString(36).slice(2),
      role: "user",
      content: text,
      time,
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    window.setTimeout(() => {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: "assistant-" + Date.now().toString(),
          role: "assistant",
          content:
            "Noted — let's map that against your evaluation strip once the base settles past the 4-hour mark.",
          time,
        },
      ]);
      setIsStreaming(false);
      inputRef.current?.focus();
    }, 1400);
  }, [input, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* Left context rail: persistent, never overlaying */}
      <div className="flex w-full shrink-0 flex-col border-b border-border md:h-[100dvh] md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Session</span>
            <span className="text-xs text-muted-foreground">Woody Amber Study</span>
          </div>
        </div>
        <Separator />
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <Card className="shadow-none">
            <CardHeader className="gap-1 p-4 pb-2">
              <CardTitle className="text-sm">Formula context</CardTitle>
              <CardDescription className="text-xs">
                Shared with the coach for this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Textarea
                value={formulaContext}
                onChange={(e) => setFormulaContext(e.target.value)}
                placeholder="Paste ingredients, percentages, or notes…"
                className="min-h-28 resize-none text-sm"
              />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="gap-1 p-4 pb-2">
              <CardTitle className="text-sm">Session info</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-4 pt-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium text-foreground">{messageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="font-normal">
                  {isStreaming ? "responding…" : "active"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right conversation pane */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
              <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-20 text-center">
              <div className="flex h-13 w-13 items-center justify-center rounded-md bg-accent p-3">
                <Droplet className="h-5 w-5 text-accent-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground">Ask your coach</p>
              <p className="max-w-xs text-sm leading-5 text-muted-foreground">
                Ask about structure, contrast, materials, dosage experiments, or evaluation
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${isUser ? "flex-row-reverse self-end" : "self-start"}`}
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback
                        className={
                          isUser
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-accent text-accent-foreground"
                        }
                      >
                        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex max-w-[80%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <span className="whitespace-pre-wrap">{m.content}</span>
                        {m.isStreaming ? (
                          <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-current align-middle" />
                        ) : null}
                      </div>
                      <span className="px-1 text-xs text-muted-foreground">{m.time}</span>
                    </div>
                  </div>
                );
              })}

              {showTyping ? (
                <div className="flex items-end gap-2 self-start">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary" className="w-fit gap-1 font-normal">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                    typing…
                  </Badge>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex shrink-0 items-end gap-2 px-3 py-3 md:px-8">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach…"
            rows={1}
            className="mx-auto max-h-32 min-h-11 max-w-2xl flex-1 resize-none"
          />
          <Button
            size="icon"
            disabled={!input.trim() || isStreaming}
            onClick={sendMessage}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
