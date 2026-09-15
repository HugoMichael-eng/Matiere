import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Beaker, Bookmark, FlaskConical, Leaf, Paperclip, Send, Sparkles, X,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import {
  getGetConversationQueryKey, getListConversationsQueryKey,
} from "@workspace/api-client-react";
import type { Material } from "@workspace/api-client-react";
import { normalizeMaterialFamilies } from "@workspace/material-families";
import { MarkdownMessage } from "../components/MarkdownMessage";
import type { StreamMessage } from "../hooks/useStreamMessage";
import type { StudioFile, FormulaFileAnalysis } from "../types/files";
import { FILE_ACCEPT, MAX_UPLOAD_BYTES, canAnalyzeFormulaFile as canAnalyzeImportedFile, fileSize as formatFileSize } from "../types/files";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { Shell } from "../components/Shell";
import { FileCategoryIcon } from "../components/FileCategoryIcon";
import { CoachingPanel } from "../components/CoachingPanel";
import { useCoaching } from "../hooks/useCoaching";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const BASE_MOODS = [
  { name: "Clean",  prompt: "A clean, transparent skin scent — no soap, just presence",  img: "/images/mood-clean.jpg",  families: ["musk"] },
  { name: "Warm",   prompt: "A warm, resinous amber with depth and sensuality",          img: "/images/mood-warm.jpg",   families: ["resinous", "spicy"] },
  { name: "Dark",   prompt: "A dark, smoky, almost feral composition",                   img: "/images/mood-dark.jpg",   families: ["woody", "resinous"] },
  { name: "Fresh",  prompt: "A luminous fresh green accord — dew, herbs, cut stems",     img: "/images/mood-fresh.jpg",  families: ["green", "fresh", "citrus"] },
  { name: "Floral", prompt: "A romantic, heady white floral that lingers",               img: "/images/mood-floral.jpg", families: ["floral"] },
  { name: "Woody",  prompt: "A dry, cerebral woody accord — sandalwood, cedar, vetiver", img: "/images/mood-woody.jpg",  families: ["woody"] },
] as const;

const BASE_ACCORDS = [
  { name: "Clean Musk",       desc: "Soft. Transparent. Skin-like.",  icon: Sparkles, families: ["musk"] },
  { name: "Amber Woods",      desc: "Warm. Resinous. Addictive.",     icon: Leaf,     families: ["resinous", "woody"] },
  { name: "Fresh Citrus",     desc: "Bright. Zesty. Uplifting.",      icon: Beaker,   families: ["citrus"] },
  { name: "Modern Patchouli", desc: "Earthy. Textured. Refined.",     icon: Leaf,     families: ["woody"] },
  { name: "White Florals",    desc: "Luminous. Heady. Sensual.",      icon: Sparkles, families: ["floral"] },
  { name: "Chypre",           desc: "Mossy. Elegant. Complex.",       icon: Beaker,   families: ["green", "citrus"] },
] as const;



export function Coach() {
  const search = useSearch();
  const rawFormulaId = new URLSearchParams(search).get("formula");
  const formulaId = rawFormulaId ? Number(rawFormulaId) : null;
  const rawConvId = new URLSearchParams(search).get("conv");
  const convFromUrl = rawConvId && Number.isFinite(Number(rawConvId)) ? Number(rawConvId) : null;
  const autoSendParam = new URLSearchParams(search).get("autoSend");
  const attachIntent = new URLSearchParams(search).get("attach") === "1";
  const {
    queryClient: qc,
    activeFormula,
    conversationsQuery: convsQuery,
    conversations,
    conversationQuery: convQuery,
    activeConversation: activeConv,
    libraryMaterials,
    createConversation: createConv,
    deleteConversation: deleteConv,
    streamMessage: streamMsg,
    selectedConversationId: selectedConvId,
    setSelectedConversationId: setSelectedConvId,
    newTitle,
    setNewTitle,
    creatingNew,
    setCreatingNew,
    message,
    setMessage,
    sessionSearch,
    pinnedIds,
    togglePin,
  } = useCoaching({ formulaId, conversationId: convFromUrl });

  const buildContext = useCallback((f: typeof activeFormula): string | null => {
    if (!f) return null;
    return [
      `Formula: ${f.name}`,
      f.brief ? `Brief: ${f.brief}` : null,
      `Concentration: ${f.concentration}% EDP · ${f.totalMl}ml batch`,
      f.ingredients.length
        ? `Ingredients: ${f.ingredients.map(i => `${i.materialName} ${i.percentage}% (${i.role})`).join(", ")}`
        : null,
      f.notes ? `Notes: ${f.notes}` : null,
    ].filter(Boolean).join("\n");
  }, []);

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const attachStartedRef = useRef(false);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<FormulaFileAnalysis | null>(null);
  const [attachedFile, setAttachedFile] = useState<StudioFile | null>(null);
  const [fileAnalysisError, setFileAnalysisError] = useState<string | null>(null);
  // Auto-send a seed message when an accord/mood creates a new session
  const [pendingAutoMessage, setPendingAutoMessage] = useState<string | null>(null);
  const pendingSentRef = useRef(false);
  useEffect(() => {
    if (pendingSentRef.current) return;
    if (!pendingAutoMessage || !selectedConvId || !activeConv) return;
    if (activeConv.messages.length > 0) { setPendingAutoMessage(null); return; }
    pendingSentRef.current = true;
    const msg = pendingAutoMessage;
    setPendingAutoMessage(null);
    const convId = selectedConvId;
    const optimisticId = -Date.now();
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
      old ? { ...old, messages: [...old.messages, { id: optimisticId, conversationId: convId, role: "user" as const, content: msg, createdAt: new Date().toISOString() }] } : old
    );
    streamMsg.send(convId, { message: msg, formulaContext: null }, {
      onUserMessage: (userMsg) => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) } : old
        );
      },
      onDone: (assistantMsg) => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: [...old.messages, assistantMsg] } : old
        );
        qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
      },
      onError: () => {
        qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) =>
          old ? { ...old, messages: old.messages.filter(m => m.id !== optimisticId) } : old
        );
      },
    });
  }, [pendingAutoMessage, selectedConvId, activeConv, streamMsg, qc]);

  // Auto-send the message from QuickPrompt once the conversation is ready
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSentRef.current) return;
    if (!autoSendParam || !selectedConvId || !activeConv) return;
    autoSentRef.current = true;
    const ctx = buildContext(activeFormula);
    const convId = selectedConvId;

    // Optimistic update: show the user bubble immediately
    const optimisticId = -Date.now();
    const optimisticMsg: StreamMessage = {
      id: optimisticId,
      conversationId: convId,
      role: "user",
      content: autoSendParam,
      createdAt: new Date().toISOString(),
    };
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
      if (!old) return old;
      return { ...old, messages: [...old.messages, optimisticMsg] };
    });

    let serverConfirmed = false;

    streamMsg.send(
      convId,
      { message: autoSendParam, formulaContext: ctx },
      {
        onUserMessage: (userMsg) => {
          serverConfirmed = true;
          // Swap the optimistic bubble for the server-confirmed message
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) };
          });
        },
        onDone: (assistantMsg) => {
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: [...old.messages, assistantMsg] };
          });
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          if (serverConfirmed) return; // message persisted — leave the bubble as-is
          // Roll back the optimistic bubble (pure network/HTTP failure)
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.filter(m => m.id !== optimisticId) };
          });
        },
      },
    );
  }, [autoSendParam, selectedConvId, activeConv, activeFormula, streamMsg, qc, buildContext]);

  // Scroll messages to bottom on update
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length, streamMsg.streamingContent, streamMsg.isPending]);

  const createWithTitle = (title: string, autoMessage?: string) => {
    pendingSentRef.current = false; // reset so the effect can fire for this new session
    createConv.mutate(
      { data: { title } },
      {
        onSuccess: (conv) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conv.id);
          setCreatingNew(false);
          setNewTitle("");
          if (autoMessage) setPendingAutoMessage(autoMessage);
        },
      },
    );
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createWithTitle(newTitle.trim() || "New session");
  };

  useEffect(() => {
    if (!attachIntent || attachStartedRef.current || selectedConvId || createConv.isPending) return;
    attachStartedRef.current = true;
    createConv.mutate(
      { data: { title: "Formula file analysis" } },
      {
        onSuccess: (conversation) => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conversation.id);
          setCreatingNew(false);
        },
        onError: () => {
          attachStartedRef.current = false;
          setFileAnalysisError("Couldn't create an analysis session. Please try again.");
        },
      },
    );
  }, [attachIntent, selectedConvId, createConv, qc]);

  const analyzeFile = async (file: File) => {
    if (!file.size || file.size > MAX_UPLOAD_BYTES) {
      setFileAnalysisError("Choose a file between 1 byte and 25 MB.");
      return;
    }
    setIsAnalyzingFile(true);
    setFileAnalysisError(null);
    setFileAnalysis(null);
    try {
      const request = await fetch(`${basePath}/api/uploads/request-url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
      });
      const requested = await request.json().catch(() => ({})) as { uploadUrl?: string; objectKey?: string; category?: StudioFile["category"]; error?: string };
      if (!request.ok || !requested.uploadUrl || !requested.objectKey || !requested.category) throw new Error(requested.error ?? "Couldn't prepare this formula file.");
      const stored = await fetch(requested.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!stored.ok) throw new Error("The formula file could not be saved.");
      const completed = await fetch(`${basePath}/api/uploads`, {
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
      const saved = await completed.json().catch(() => ({})) as StudioFile & { error?: string };
      if (!completed.ok || !saved.id) throw new Error(saved.error ?? "The upload finished but could not be filed.");
      setAttachedFile(saved);
      if (!canAnalyzeImportedFile(saved)) {
        setMessage(`I attached “${saved.name}”. It is saved in the File Drawer. Tell me what you want to explore from this reference.`);
        qc.invalidateQueries({ queryKey: ["studio-files"] });
        return;
      }
      const analysisResponse = await fetch(`${basePath}/api/uploads/${saved.id}/analyze`, {
        method: "POST",
        credentials: "include",
      });
      const analysis = await analysisResponse.json().catch(() => ({})) as FormulaFileAnalysis & { error?: string };
      if (!analysisResponse.ok) throw new Error(analysis.error ?? "I couldn't read that formula.");
      setFileAnalysis(analysis);
      setMessage(`I uploaded “${analysis.sourceFile}”. Review the formula analysis below and help me decide what to adjust next.`);
      qc.invalidateQueries({ queryKey: ["studio-files"] });
    } catch (error) {
      setFileAnalysisError(error instanceof Error ? error.message : "I couldn't analyze that file.");
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const beginHubAttachment = (file: File) => {
    if (selectedConvId) {
      void analyzeFile(file);
      return;
    }
    setFileAnalysisError(null);
    createConv.mutate(
      { data: { title: "File analysis" } },
      {
        onSuccess: conversation => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          setSelectedConvId(conversation.id);
          setCreatingNew(false);
          void analyzeFile(file);
        },
        onError: () => setFileAnalysisError("Couldn't create a session for this file. Please try again."),
      },
    );
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    // Require activeConv to be loaded so the optimistic cache write always has a target
    if (!message.trim() || !selectedConvId || !activeConv) return;
    const ctx = buildContext(activeFormula);
    const sentMessage = message;
    setMessage("");
    const convId = selectedConvId;

    // Optimistic update: show the user bubble immediately, before the server confirms
    const optimisticId = -Date.now();
    const optimisticMsg: StreamMessage = {
      id: optimisticId,
      conversationId: convId,
      role: "user",
      content: sentMessage,
      createdAt: new Date().toISOString(),
    };
    qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
      if (!old) return old;
      return { ...old, messages: [...old.messages, optimisticMsg] };
    });

    // Track whether the server has persisted and confirmed the user message.
    // If it has, a later generation failure must NOT roll back the bubble (the
    // message is in the DB) and must NOT restore the input (retrying would duplicate it).
    let serverConfirmed = false;

    streamMsg.send(
      convId,
      { message: sentMessage, formulaContext: ctx },
      {
        onUserMessage: (userMsg) => {
          serverConfirmed = true;
          // Swap the optimistic bubble for the server-confirmed message
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.map(m => m.id === optimisticId ? userMsg : m) };
          });
        },
        onDone: (assistantMsg) => {
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: [...old.messages, assistantMsg] };
          });
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          if (serverConfirmed) {
            // The user message is already persisted on the server — leave the bubble
            // and do not restore the input (retrying would create a duplicate).
            return;
          }
          // Pure network / HTTP failure before the server saved anything — roll back
          // the optimistic bubble and let the user try again.
          qc.setQueryData(getGetConversationQueryKey(convId), (old: { messages: StreamMessage[] } | undefined) => {
            if (!old) return old;
            return { ...old, messages: old.messages.filter(m => m.id !== optimisticId) };
          });
          setMessage(sentMessage);
        },
      },
    );
  };

  const handleDelete = (convId: number) => {
    if (!window.confirm("Delete this session?")) return;
    deleteConv.mutate(
      { conversationId: convId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (selectedConvId === convId) setSelectedConvId(null);
        },
      },
    );
  };

  const relativeDate = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter(c =>
    !sessionSearch.trim() || c.title.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  // ── Personalized moods & accords from the user's material library ──
  const { moods, accords } = useMemo(() => {
    // Group the library by canonical olfactive family aliases. A material can
    // belong to more than one family when its value is composite.
    const byFamily = new Map<string, Material[]>();
    for (const m of libraryMaterials) {
      for (const key of normalizeMaterialFamilies(m.family)) {
        const list = byFamily.get(key) ?? [];
        list.push(m);
        byFamily.set(key, list);
      }
    }
    const has = (fams: readonly string[]) => fams.some(f => (byFamily.get(f)?.length ?? 0) > 0);
    const owned = (fams: readonly string[]) =>
      fams.flatMap(f => byFamily.get(f) ?? []).map(m => m.name);

    const moodList = BASE_MOODS.map(mood => {
      const names = owned(mood.families);
      const prompt = names.length > 0
        ? `${mood.prompt}. From my own material library I have: ${names.slice(0, 6).join(", ")} — build the direction around what I already own.`
        : mood.prompt;
      return { ...mood, prompt, ownedCount: names.length };
    });

    const accordList = BASE_ACCORDS.map(accord => {
      const names = owned(accord.families);
      const buildable = accord.families.length > 0 && accord.families.every(f => has([f]));
      const missingFamilies = accord.families.filter(f => !has([f]));
      const familyLabel = accord.families[0] ?? "";
      const hint = names.length > 0
        ? (names.length === 1
            ? `You have ${names[0]} — a starting point.`
            : `You have ${names.length} ${familyLabel} materials to build with.`)
        : null;
      return { ...accord, ownedNames: names, buildable, missingFamilies, hint };
    });

    // Buildable accords first, so suggestions lead with what the studio actually owns
    accordList.sort((a, b) => Number(b.buildable) - Number(a.buildable));

    return { moods: moodList, accords: accordList };
  }, [libraryMaterials]);

  // ── View: hub vs chat ──
  const inChat = !!selectedConvId;

  return (
    <Shell>
      {/* ════════════════════════════════════════
          HUB VIEW  (no session selected)
      ════════════════════════════════════════ */}
      {!inChat && (
        <div className="-mx-5 sm:-mx-8 lg:-mx-12 overflow-y-auto" style={{ height: "calc(100dvh - 3.5rem)" }}>
          <div className="mx-auto max-w-2xl px-5 pb-20 pt-8 sm:px-8">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono-ui text-[8px] uppercase tracking-[.28em] text-muted-foreground">Creative lab</p>
                <h1 className="mt-2 font-display text-5xl leading-[1.0] tracking-tight sm:text-6xl">
                  What are you<br />working on?
                </h1>
              </div>
              <div className="mt-1 flex shrink-0 items-center gap-2">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept={FILE_ACCEPT}
                  className="sr-only"
                  data-testid="input-coach-formula-upload"
                  onChange={event => {
                    const [file] = Array.from(event.target.files ?? []);
                    if (file) beginHubAttachment(file);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isAnalyzingFile || createConv.isPending}
                  data-testid="button-attach-formula-file"
                  aria-label="Upload a studio file"
                  className="grid size-9 place-items-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  {isAnalyzingFile ? <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" /> : <Paperclip size={15} />}
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCreatingNew(v => !v)}
                  data-testid="button-new-session"
                  className="bg-foreground px-5 py-2.5 font-mono-ui text-[9px] uppercase tracking-widest text-background transition-opacity hover:opacity-75"
                >
                  + New
                </motion.button>
              </div>
            </div>

            {/* ── New-session inline form ── */}
            <AnimatePresence>
              {creatingNew && (
                <motion.form
                  key="new-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleCreate}
                  className="overflow-hidden"
                >
                  <div className="mt-5 border border-border bg-secondary/15 px-5 py-4">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Name this thread…"
                      data-testid="input-session-title"
                      className="w-full border-b border-border bg-transparent pb-2 text-sm outline-none placeholder:text-muted-foreground/40"
                    />
                    <div className="mt-3 flex gap-2">
                      <Button type="submit" disabled={createConv.isPending} testId="button-create-conv">
                        {createConv.isPending ? "Creating…" : "Create"}
                      </Button>
                      <Button onClick={() => { setCreatingNew(false); setNewTitle(""); }} variant="quiet" testId="button-cancel-create">Cancel</Button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* ── Explore by mood ── */}
            <div className="mt-10">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Explore by mood</p>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
                {moods.map((mood, i) => (
                  <motion.button
                    key={mood.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => createWithTitle(mood.name, `Give me a creative brief for a ${mood.name.toLowerCase()} fragrance direction — ${mood.prompt}. Describe the feeling, the key materials that define it, and two or three specific accord ideas I could explore.`)}
                    disabled={createConv.isPending}
                    className="group flex shrink-0 flex-col items-center gap-2.5 disabled:opacity-50"
                  >
                    <div className="relative size-[72px] overflow-hidden rounded-full ring-1 ring-border transition-all duration-200 group-hover:ring-2 group-hover:ring-foreground/30">
                      <img src={mood.img} alt={mood.name} className="size-full object-cover" />
                      <div className="absolute inset-0 rounded-full bg-foreground/0 transition-colors duration-200 group-hover:bg-foreground/5" />
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">{mood.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* ── Popular accords ── */}
            <div className="mt-10">
              <p className="mb-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Popular accords</p>
              <div className="space-y-2">
                {accords.map((accord, i) => {
                  const Icon = accord.icon;
                  return (
                    <motion.div
                      key={accord.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="group flex w-full items-center gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3.5 transition-colors hover:bg-secondary/40">
                        <button
                          type="button"
                          onClick={() => createWithTitle(accord.name, accord.ownedNames.length > 0
                            ? `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), and how I could build it starting from materials I already own: ${accord.ownedNames.slice(0, 6).join(", ")}. What would I still need to add?`
                            : `Tell me about the ${accord.name} accord — what defines it (${accord.desc}), which raw materials are essential to building it, and what's a modern take I could explore?`)}
                          disabled={createConv.isPending}
                          className="flex min-w-0 flex-1 items-center gap-4 text-left disabled:opacity-50"
                        >
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-background">
                            <Icon size={14} strokeWidth={1.5} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-medium">{accord.name}</p>
                              {accord.buildable && (
                                <span
                                  className="inline-flex shrink-0 items-center border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono-ui text-[7px] uppercase tracking-widest text-accent-foreground/70"
                                  data-testid={`badge-buildable-${accord.name.toLowerCase().replaceAll(" ", "-")}`}
                                >
                                  You have the materials
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{accord.hint ?? accord.desc}</p>
                          </div>
                          <ArrowRight size={13} className="shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                        </button>
                        {accord.missingFamilies.length === 1 && (
                          <Link
                            href={`/materials?search=${encodeURIComponent(accord.missingFamilies[0])}`}
                            data-testid={`link-missing-family-${accord.name.toLowerCase().replaceAll(" ", "-")}`}
                            className="shrink-0 border-l border-border pl-4 font-mono-ui text-[8px] uppercase tracking-[.12em] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Missing: {accord.missingFamilies[0]}
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Recent inspiration (sessions) ── */}
            {conversations.length > 0 && (
              <div className="mt-10">
                <p className="mb-4 font-mono-ui text-[9px] uppercase tracking-[.22em] text-foreground">Recent inspiration</p>
                {convsQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-[72px] w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-px border-t border-border">
                    {[...conversations.filter(c => pinnedIds.has(c.id)), ...conversations.filter(c => !pinnedIds.has(c.id))].slice(0, 8).map((conv, i) => {
                      const isPinned = pinnedIds.has(conv.id);
                      return (
                        <motion.button
                          key={conv.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedConvId(conv.id)}
                          data-testid={`button-session-${conv.id}`}
                          className="group flex w-full items-start justify-between gap-4 border-b border-border py-5 text-left transition-colors hover:bg-secondary/10"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {isPinned && <span className="font-mono-ui text-[7px] uppercase tracking-widest text-accent-foreground/60">Pinned</span>}
                              <p className="text-base font-medium leading-snug group-hover:text-foreground">{conv.title}</p>
                            </div>
                            <p className="mt-1.5 font-mono-ui text-[8px] text-muted-foreground/50">
                              {conv.messageCount ?? 0} {(conv.messageCount ?? 0) === 1 ? "msg" : "msgs"} · {relativeDate(conv.updatedAt)}
                            </p>
                          </div>
                          <div className="mt-0.5 flex shrink-0 items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); togglePin(conv.id); }}
                              aria-label={isPinned ? "Unpin session" : "Pin session"}
                              className={`transition-opacity ${isPinned ? "opacity-100 text-foreground" : "opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground"}`}
                            >
                              <Bookmark size={12} className={isPinned ? "fill-foreground" : ""} />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(conv.id); }}
                              aria-label="Delete session"
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive"
                            >
                              <X size={11} />
                            </button>
                            <ArrowRight size={13} className="text-muted-foreground/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty state — no sessions yet */}
            {conversations.length === 0 && !convsQuery.isLoading && (
              <div className="mt-12 border border-dashed border-border px-6 py-10 text-center">
                <p className="font-display text-2xl">No threads yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Tap a mood, an accord, or «+ New» to start your first session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CHAT VIEW  (session selected)
      ════════════════════════════════════════ */}
      {inChat && (
        <CoachingPanel>

          {/* Top bar */}
          <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3 sm:px-8">
            <button
              onClick={() => setSelectedConvId(null)}
              className="grid size-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Back to lab"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="min-w-0 flex-1">
              {activeConv ? (
                <p className="truncate text-sm font-medium">{activeConv.title}</p>
              ) : (
                <Skeleton className="h-4 w-48" />
              )}
            </div>
            {activeFormula && (
              <Link
                href={`/formulas/${activeFormula.id}`}
                data-testid="link-active-formula"
                className="flex shrink-0 items-center gap-1.5 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                <FlaskConical size={9} />
                {activeFormula.name} ↗
              </Link>
            )}
            <button
              onClick={() => handleDelete(selectedConvId!)}
              aria-label="Delete session"
              className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive"
            >
              <X size={13} />
            </button>
          </div>

          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-2xl space-y-7 px-5 py-8 sm:px-8">
              {convQuery.isLoading && <Skeleton className="h-24 w-full" />}

              {activeConv?.messages.length === 0 && !convQuery.isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="py-16 text-center"
                >
                  <p className="font-display text-4xl">What are you working on?</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {activeFormula
                      ? `The lab knows about ${activeFormula.name}. Ask about its structure, a material, or what to try next.`
                      : "A difficult material, a flat drydown, a brief that won't settle. Bring the unfinished thought."}
                  </p>
                </motion.div>
              )}

              {activeConv?.messages.map(msg => (
                <div key={msg.id} className={msg.role === "user" ? "pl-8 sm:pl-16" : "pr-2"}>
                  <p className="mb-2 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50">
                    {msg.role === "user" ? "You" : "Lab"} · {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className={msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm border border-border bg-secondary/30 px-4 py-3 text-sm leading-6"
                    : "border-l-2 border-accent pl-5 text-sm leading-7"
                  }>
                    {msg.role === "user" ? msg.content : <MarkdownMessage content={msg.content} />}
                  </div>
                </div>
              ))}

              {streamMsg.isPending && (
                <div className="pr-2">
                  <p className="mb-2 font-mono-ui text-[7px] uppercase tracking-widest text-muted-foreground/50">Lab · now</p>
                  <div className="border-l-2 border-accent pl-5 text-sm leading-7">
                    {streamMsg.streamingContent
                      ? <MarkdownMessage content={streamMsg.streamingContent} />
                      : (
                        <div className="flex gap-1.5 py-2">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="size-1.5 animate-pulse rounded-full bg-accent/60" style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
              {attachedFile && !fileAnalysis && (
                <div className="border border-border bg-secondary/15 p-5" data-testid="panel-file-attachment">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center border border-border bg-background text-muted-foreground"><FileCategoryIcon category={attachedFile.category} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">File attached</p>
                      <p className="truncate text-sm font-medium">{attachedFile.name}</p>
                    </div>
                    <Link href="/files" className="shrink-0 font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Open drawer ↗</Link>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">This reference is filed and ready to discuss. JSON and CSV formula exports also receive ingredient, allergen, and IFRA analysis here.</p>
                </div>
              )}
              {fileAnalysis && (
                <div className="border border-border bg-secondary/15 p-5" data-testid="panel-formula-file-analysis">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono-ui text-[8px] uppercase tracking-[.2em] text-muted-foreground">Formula file read</p>
                      <h2 className="mt-1 font-display text-3xl">{fileAnalysis.formulaName}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{fileAnalysis.ingredientCount} ingredients · {fileAnalysis.sourceFile}</p>
                    </div>
                    <button onClick={() => setFileAnalysis(null)} aria-label="Dismiss analysis" className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-6">{fileAnalysis.interpretation}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Known allergens</p>
                      <p className="mt-2 text-sm">{fileAnalysis.allergens.length ? fileAnalysis.allergens.join(", ") : "None found in matched materials."}</p>
                    </div>
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">Unmatched materials</p>
                      <p className="mt-2 text-sm">{fileAnalysis.unknownMaterials.length ? fileAnalysis.unknownMaterials.join(", ") : "All ingredients matched."}</p>
                    </div>
                    <div className="border border-border bg-background/70 p-3">
                      <p className="font-mono-ui text-[8px] uppercase tracking-widest text-muted-foreground">IFRA review</p>
                      <p className="mt-2 text-sm">{fileAnalysis.ifraWarnings.length ? `${fileAnalysis.ifraWarnings.length} item${fileAnalysis.ifraWarnings.length === 1 ? "" : "s"} need review.` : "No library-limit flags."}</p>
                    </div>
                  </div>
                  {fileAnalysis.ifraWarnings.length > 0 && <ul className="mt-4 space-y-1 border-l-2 border-destructive/60 pl-3 text-xs leading-5 text-muted-foreground">{fileAnalysis.ifraWarnings.map(item => <li key={item.material}><strong className="text-foreground">{item.material}:</strong> {item.warning}</li>)}</ul>}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">A ready-to-send question has been added to the prompt below so you can continue with the AI coach.</p>
                    {attachedFile && <Link href={`/files?analyze=${attachedFile.id}`} className="font-mono-ui text-[9px] uppercase tracking-widest text-foreground underline-offset-4 hover:underline" data-testid="link-save-coach-analysis">
                      Review &amp; save as draft ↗
                    </Link>}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Pinned input */}
          <div className="shrink-0 border-t border-border px-5 py-4 sm:px-8">
            <input
              ref={attachmentInputRef}
              type="file"
              accept={FILE_ACCEPT}
              className="sr-only"
              data-testid="input-coach-formula-upload"
              onChange={event => {
                const [file] = Array.from(event.target.files ?? []);
                if (file) void analyzeFile(file);
                event.target.value = "";
              }}
            />
            <form onSubmit={handleSend} className="mx-auto flex max-w-2xl items-center gap-3 rounded-full border border-border bg-secondary/20 px-5 py-2.5">
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={isAnalyzingFile || streamMsg.isPending || !activeConv}
                data-testid="button-attach-formula-file"
                aria-label="Upload formula file for analysis"
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-30"
              >
                {isAnalyzingFile ? <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" /> : <Paperclip size={15} />}
              </button>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={streamMsg.isPending || !activeConv}
                data-testid="input-coach-message"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder={activeFormula ? `Ask about ${activeFormula.name}…` : "I'm working on…"}
              />
              <button
                type="submit"
                disabled={streamMsg.isPending || !message.trim() || !activeConv}
                data-testid="button-send-coach"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background disabled:opacity-30"
              >
                {streamMsg.isPending
                  ? <span className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                  : <Send size={13} />}
              </button>
            </form>
            {streamMsg.error && (
              <p className="mt-2 text-center text-xs text-destructive" data-testid="status-coach-error">{streamMsg.error}</p>
            )}
            {fileAnalysisError && <p className="mt-2 text-center text-xs text-destructive" data-testid="status-formula-file-error">{fileAnalysisError}</p>}
            {attachIntent && !fileAnalysis && !isAnalyzingFile && (
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                className="mx-auto mt-3 flex items-center gap-2 border border-border px-3 py-2 text-xs transition-colors hover:bg-secondary"
                data-testid="button-start-formula-file-analysis"
              >
                <Paperclip size={13} /> Attach a formula file to start analysis
              </button>
            )}
            <p className="mx-auto mt-2 max-w-2xl text-center font-mono-ui text-[7px] uppercase tracking-[.12em] text-muted-foreground/60">Attach JSON or CSV formula exports for AI analysis, allergen matching, and IFRA review</p>
          </div>
        </CoachingPanel>
      )}
    </Shell>
  );
}

export default Coach;
