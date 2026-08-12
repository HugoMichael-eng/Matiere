import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Droplet,
  FileText,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content:
      "I'm testing a new woody-amber base with 8% Iso E Super. Contrast feels flat after 30 minutes — any structural fixes?",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Flat contrast usually means your top and heart materials are decaying at a similar rate to the base. Try layering a sharper aldehydic or citrus top at a lower dosage so it fades faster, and lean into a resinous or animalic note in the heart to widen the gap before the base takes over.",
  },
  {
    id: "m3",
    role: "user",
    content: "Would labdanum work better than benzoin here for that resin note?",
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Labdanum is the stronger move — it brings a leathery, ambery depth that plays well against Iso E Super without competing for the same 'soft musk' space benzoin occupies. Start around 3-4% and evaluate at the 2-hour mark.",
  },
];

/**
 * Threaded log layout — a structural variation on the original two-sided
 * bubble chat. Instead of left/right aligned colored bubbles, messages are
 * organized as a single-column identity-first log: avatar + role label sit
 * above each message block, consecutive same-role turns are grouped, and
 * the formula-context panel moves from an inline top strip into a slide-in
 * side sheet so the log itself gets full width and undivided visual weight.
 */
export default function ChatThreadedLayout() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [formulaContext, setFormulaContext] = useState(
    "Base: Iso E Super 8%, Ambroxan 4%, Cedramber 3%",
  );
  const [contextOpen, setContextOpen] = useState(false);
  const [isLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const grouped = useMemo(() => {
    const blocks: { role: ChatMessage["role"]; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const last = blocks[blocks.length - 1];
      if (last && last.role === m.role) {
        last.items.push(m);
      } else {
        blocks.push({ role: m.role, items: [m] });
      }
    }
    return blocks;
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    const tempUserMsg: ChatMessage = {
      id: "opt-user-" + Date.now().toString() + Math.random().toString(36).slice(2),
      role: "user",
      content: text,
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
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      {/* Compact top bar: back, centered title, context trigger */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-1 flex-col items-center">
          <span className="text-sm font-semibold text-foreground">Session</span>
          <span className="text-xs text-muted-foreground">Woody Amber Study</span>
        </div>
        <Sheet open={contextOpen} onOpenChange={setContextOpen}>
          <Button
            variant={contextOpen ? "secondary" : "ghost"}
            size="icon"
            aria-label="Formula context"
            onClick={() => setContextOpen(true)}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <SheetContent side="right" className="flex w-3/4 flex-col gap-4 sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Formula context</SheetTitle>
              <SheetDescription>
                Optional notes shared with the coach for this session.
              </SheetDescription>
            </SheetHeader>
            <Textarea
              value={formulaContext}
              onChange={(e) => setFormulaContext(e.target.value)}
              placeholder="Paste ingredients, percentages, or notes…"
              className="min-h-40 flex-1 resize-none"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Threaded message log */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
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
          <div className="flex flex-col gap-6">
            {grouped.map((block, blockIdx) => {
              const isUser = block.role === "user";
              return (
                <div key={blockIdx} className="flex gap-3">
                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={
                        isUser
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-accent text-accent-foreground"
                      }
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      {isUser ? "You" : "Coach"}
                    </span>
                    <div className="flex flex-col gap-2">
                      {block.items.map((item) => (
                        <p
                          key={item.id}
                          className="whitespace-pre-wrap text-sm leading-6 text-foreground"
                        >
                          {item.content}
                          {item.isStreaming ? (
                            <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent align-middle" />
                          ) : null}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {showTyping ? (
              <div className="flex gap-3">
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-foreground">Coach</span>
                  <Badge variant="secondary" className="w-fit gap-1 font-normal">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                    typing…
                  </Badge>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Separator />

      {/* Compose row anchored bottom, single-line-first with expandable textarea */}
      <div className="flex shrink-0 items-end gap-2 px-3 py-3">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach…"
          rows={1}
          className="max-h-32 min-h-11 flex-1 resize-none"
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
  );
}
