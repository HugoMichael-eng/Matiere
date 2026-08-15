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
    max_completion_tokens: 1500,
    messages: [
      {
        role: "system",
        content: `You are a creative director and master perfumer for an independent studio. Generate exactly 3 original formula ideas. Each idea must have:
- NAME: evocative, literary, 2–5 words
- BRIEF: one sentence capturing the emotional intention (not a list of notes)
- DIRECTION: one sentence on the structural or material angle to explore
- MATERIALS: 5–7 specific aromatic materials, each with a ROLE (top / heart / base) and a PCT (integer percentage, e.g. 12). The pct values across all materials should sum to between 70 and 90. Use real perfumery materials (e.g. bergamot, iso e super, ambroxan, linalool, hedione, orris, vetiver, musks, etc.). Make the material selection serve the brief.

Return valid JSON only, no markdown, in this exact shape:
{
  "ideas": [
    {
      "name": "...",
      "brief": "...",
      "direction": "...",
      "materials": [
        { "name": "Bergamot", "role": "top", "pct": 12 },
        { "name": "Hedione", "role": "heart", "pct": 18 }
      ]
    }
  ]
}

Make ideas genuinely distinct from each other. Avoid clichés — no "fresh", "clean", "bold", "vibrant". Think like an artist, not a marketer.`,
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
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.json({
      ideas: [
        {
          name: "Something quiet",
          brief: "A scent that stays after everyone has left the room.",
          direction: "Build around ambrette seed with a trace of orris and birch tar.",
          materials: [
            { name: "Ambrette seed", role: "heart", pct: 20 },
            { name: "Orris butter", role: "heart", pct: 12 },
            { name: "Birch tar", role: "base", pct: 8 },
            { name: "Iso E Super", role: "base", pct: 18 },
            { name: "Bergamot", role: "top", pct: 15 },
          ],
        },
      ],
    });
  }
});

export default router;
