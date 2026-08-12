import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db, conversations, conversationMessages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();
router.use(requireAuth);

const SYSTEM_PROMPT =
  "You are Sillage Lab's senior perfumery coach. Help a perfumer make more original, emotionally specific work. Be concrete about structure, contrast, materials, dosage experiments, and evaluation. Never present safety guidance as a substitute for current IFRA documentation.";

function toConversationDetail(conv: typeof conversations.$inferSelect, messages: (typeof conversationMessages.$inferSelect)[]) {
  return {
    id: conv.id,
    ownerId: conv.ownerId,
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}

// GET /conversations — list all conversations for the user
router.get("/conversations", async (req, res): Promise<void> => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const rows = await db
    .select({
      id: conversations.id,
      ownerId: conversations.ownerId,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.ownerId, userId))
    .orderBy(desc(conversations.updatedAt));

  // Get message counts in one query
  const counts = await db
    .select({ conversationId: conversationMessages.conversationId, messageCount: count() })
    .from(conversationMessages)
    .where(
      eq(conversationMessages.conversationId, rows.length > 0 ? rows[0].id : -1),
    )
    .groupBy(conversationMessages.conversationId);

  // Build a map for fast lookup
  const countMap = new Map(counts.map((c) => [c.conversationId, Number(c.messageCount)]));

  res.json(
    rows.map((r) => ({
      ...r,
      messageCount: countMap.get(r.id) ?? 0,
    })),
  );
});

// POST /conversations — create a new conversation
router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = z.object({ title: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const [conv] = await db
    .insert(conversations)
    .values({ ownerId: userId, title: parsed.data.title })
    .returning();
  res.status(201).json(toConversationDetail(conv, []));
});

// GET /conversations/:conversationId — full conversation with messages
router.get("/conversations/:conversationId", async (req, res): Promise<void> => {
  const id = Number(req.params.conversationId);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.ownerId, userId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  const messages = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, id))
    .orderBy(asc(conversationMessages.createdAt));

  res.json(toConversationDetail(conv, messages));
});

// DELETE /conversations/:conversationId
router.delete("/conversations/:conversationId", async (req, res): Promise<void> => {
  const id = Number(req.params.conversationId);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  const deleted = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.ownerId, userId)))
    .returning({ id: conversations.id });
  if (!deleted.length) { res.status(404).json({ error: "Not found" }); return; }

  // cascade delete messages
  await db.delete(conversationMessages).where(eq(conversationMessages.conversationId, id));
  res.sendStatus(204);
});

// POST /conversations/:conversationId/messages — send message, get AI, save both
router.post("/conversations/:conversationId/messages", async (req, res): Promise<void> => {
  const id = Number(req.params.conversationId);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  const parsed = z
    .object({ message: z.string().min(1), formulaContext: z.string().nullable().optional() })
    .safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.ownerId, userId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Load existing history for context
  const history = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, id))
    .orderBy(asc(conversationMessages.createdAt));

  const userContent = parsed.data.formulaContext
    ? `${parsed.data.message}\n\nFormula context:\n${parsed.data.formulaContext}`
    : parsed.data.message;

  // Save user message
  const [userMsg] = await db
    .insert(conversationMessages)
    .values({ conversationId: id, role: "user", content: userContent })
    .returning();

  // Build messages array for OpenAI
  const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userContent },
  ];

  const aiResponse = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 4096,
    messages: openaiMessages,
  });

  const aiContent = aiResponse.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

  // Save assistant message
  const [assistantMsg] = await db
    .insert(conversationMessages)
    .values({ conversationId: id, role: "assistant", content: aiContent })
    .returning();

  // Touch updatedAt on conversation
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));

  res.json(
    toConversationDetail(conv, [...history, userMsg, assistantMsg]),
  );
});

// POST /conversations/:conversationId/messages/stream — streaming SSE variant
router.post("/conversations/:conversationId/messages/stream", async (req, res): Promise<void> => {
  const id = Number(req.params.conversationId);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const userId = (req as unknown as AuthenticatedRequest).userId;

  const parsed = z
    .object({ message: z.string().min(1), formulaContext: z.string().nullable().optional() })
    .safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.ownerId, userId)));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

  // Load existing history for context
  const history = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, id))
    .orderBy(asc(conversationMessages.createdAt));

  const userContent = parsed.data.formulaContext
    ? `${parsed.data.message}\n\nFormula context:\n${parsed.data.formulaContext}`
    : parsed.data.message;

  // Save user message
  const [userMsg] = await db
    .insert(conversationMessages)
    .values({ conversationId: id, role: "user", content: userContent })
    .returning();

  // Set up SSE response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if present
  res.flushHeaders();

  // Helper to write an SSE event
  const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Emit the saved user message so the client can add it immediately
  send({
    type: "user_message",
    message: {
      id: userMsg.id,
      conversationId: id,
      role: userMsg.role,
      content: userMsg.content,
      createdAt: userMsg.createdAt,
    },
  });

  const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userContent },
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      max_completion_tokens: 4096,
      messages: openaiMessages,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (token) {
        fullContent += token;
        send({ type: "token", token });
      }
    }

    // Save assistant message
    const [assistantMsg] = await db
      .insert(conversationMessages)
      .values({
        conversationId: id,
        role: "assistant",
        content: fullContent || "I couldn't generate a response. Please try again.",
      })
      .returning();

    // Touch updatedAt on conversation
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));

    // Send done event with the fully saved assistant message
    send({
      type: "done",
      message: {
        id: assistantMsg.id,
        conversationId: id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt,
      },
    });
    res.end();
  } catch (err) {
    send({ type: "error", error: "Failed to generate a response. Please try again." });
    res.end();
  }
});

export default router;
