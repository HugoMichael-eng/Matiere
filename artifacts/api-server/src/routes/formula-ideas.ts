import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();
router.use(requireAuth);

const Body = z.object({
  mood: z.string().max(300).optional(),
});

router.post("/formulas/ideas", async (req, res): Promise<void> => {
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const mood = parsed.data.mood?.trim() || "";
  const moodLine = mood ? `The perfumer is thinking about: "${mood}".` : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are a creative director for an independent perfumery studio. Generate exactly 3 original formula ideas for a perfumer. Each idea must have: a NAME (evocative, literary, 2–5 words), a BRIEF (one sentence capturing the emotional intention — not a list of notes), and a DIRECTION (one sentence on the structural or material angle to explore). Return valid JSON only, no markdown, in this exact shape: { \"ideas\": [ { \"name\": \"...\", \"brief\": \"...\", \"direction\": \"...\" } ] }. Make ideas genuinely distinct from each other. Avoid clichés — no 'fresh', 'clean', 'bold', 'vibrant'. Think like an artist, not a marketer.",
      },
      {
        role: "user",
        content: moodLine
          ? moodLine
          : "Surprise me — three original formula starting points.",
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{"ideas":[]}';
  try {
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch {
    // If the model returned malformed JSON, send a graceful fallback
    res.json({
      ideas: [
        {
          name: "Something quiet",
          brief: "A scent that stays after everyone has left the room.",
          direction: "Explore ambrette seed, orris, and a trace of birch tar.",
        },
      ],
    });
  }
});

export default router;
