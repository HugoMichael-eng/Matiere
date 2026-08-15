import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();
router.use(requireAuth);

const IdeasBody = z.object({
  mood: z.string().max(300).optional(),
});

const MaterialsBody = z.object({
  name: z.string().max(200),
  brief: z.string().max(600),
});

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

// POST /formulas/ideas — generates 3 creative formula concepts
router.post("/formulas/ideas", async (req, res): Promise<void> => {
  const parsed = IdeasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const mood = parsed.data.mood?.trim() || "";
  const userMsg = mood
    ? `The perfumer is thinking about: "${mood}".`
    : "Surprise me — three original formula starting points.";

  const response = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          'You are a creative director for an independent perfumery studio. Generate exactly 3 original formula ideas. Return valid JSON only — no markdown, no code fences — in this exact shape: { "ideas": [ { "name": "...", "brief": "...", "direction": "..." } ] }. NAME: evocative, literary, 2–5 words. BRIEF: one sentence capturing the emotional intention, not a list of notes. DIRECTION: one sentence on the structural or material angle. Make ideas genuinely distinct. Avoid clichés — no "fresh", "clean", "bold", "vibrant". Think like an artist.',
      },
      { role: "user", content: userMsg },
    ],
  });

  const raw = stripFences(response.choices[0]?.message?.content ?? '{"ideas":[]}');
  try {
    res.json(JSON.parse(raw));
  } catch {
    res.json({
      ideas: [
        { name: "Something quiet", brief: "A scent that stays after everyone has left the room.", direction: "Explore ambrette seed, orris, and a trace of birch tar." },
      ],
    });
  }
});

// POST /formulas/idea-materials — returns material suggestions for a chosen idea
router.post("/formulas/idea-materials", async (req, res): Promise<void> => {
  const parsed = MaterialsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, brief } = parsed.data;

  const response = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 600,
    messages: [
      {
        role: "system",
        content:
          'You are a master perfumer. Given a formula concept, suggest 5–7 specific aromatic materials that would build it. Return valid JSON only — no markdown, no code fences — in this shape: { "materials": [ { "name": "Bergamot", "role": "top", "pct": 12 } ] }. ROLE must be exactly "top", "heart", or "base". PCT must be an integer. All pct values must sum between 70 and 90. Use real, specific perfumery materials (e.g. iso e super, hedione, ambroxan, linalool, vetiver, musks, orris, etc.). The selection must serve the brief.',
      },
      {
        role: "user",
        content: `Formula name: "${name}"\nBrief: "${brief}"\n\nSuggest materials.`,
      },
    ],
  });

  const raw = stripFences(response.choices[0]?.message?.content ?? '{"materials":[]}');
  try {
    res.json(JSON.parse(raw));
  } catch {
    res.json({
      materials: [
        { name: "Ambrette seed", role: "heart", pct: 20 },
        { name: "Orris butter",  role: "heart", pct: 12 },
        { name: "Iso E Super",   role: "base",  pct: 18 },
        { name: "Bergamot",      role: "top",   pct: 15 },
        { name: "Birch tar",     role: "base",  pct: 8  },
      ],
    });
  }
});

export default router;
