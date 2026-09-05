import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();
router.use(requireAuth);

// The configured AI integration accepts the same model used by formula analysis.
const FORMULA_IDEAS_MODEL = "gpt-5.4-mini";

const IdeasBody = z.object({
  mood: z.string().max(300).optional(),
});

const MaterialsBody = z.object({
  name: z.string().max(200),
  brief: z.string().max(1200),
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

  let response;
  try {
    response = await openai.chat.completions.create({
      model: FORMULA_IDEAS_MODEL,
      max_completion_tokens: 800,
      messages: [
        {
          role: "system",
          content:
            'You are a creative director at an independent fine fragrance studio working with professional perfumers. Generate exactly 3 original formula concepts. Return valid JSON only — no markdown, no code fences — in this exact shape: { "ideas": [ { "name": "...", "brief": "...", "direction": "..." } ] }. NAME: evocative and literary, 2–5 words, no generic perfume titles. BRIEF: one sentence of pure emotional or sensory intention — what the wearer feels or remembers, never a list of notes. DIRECTION: one sentence describing the structural or material strategy — name the accord architecture, a key tension (e.g. mineral vs. animalic, green vs. resinous), or a specific technique (e.g. chypre base inverted, musk-forward skeleton, lactonic heart). Make the three ideas genuinely distinct in both concept and structure. No clichés: avoid "fresh", "clean", "vibrant", "bold", "sensual", "luxurious". Think like a Nose with 20 years of competition experience.',
        },
        { role: "user", content: userMsg },
      ],
    });
  } catch (error) {
    req.log.error({ err: error, model: FORMULA_IDEAS_MODEL }, "Formula idea generation failed");
    res.status(502).json({ error: "The idea generator is temporarily unavailable. Please try again." });
    return;
  }

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

  let response;
  try {
    response = await openai.chat.completions.create({
      model: FORMULA_IDEAS_MODEL,
      max_completion_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `You are a professional perfumer with decades of fine fragrance experience. Given a formula concept, compose a complete working material list as a professional studio Nose would — typically 20–40 ingredients depending on the complexity the concept demands. Do not pad; do not truncate. The list should reflect the actual complexity a fine fragrance of this type requires.

Return valid JSON only — no markdown, no code fences — in this exact shape:
{ "materials": [ { "name": "Bergamot", "role": "top", "pct": 12 } ] }

RULES:
- ROLE must be exactly "top", "heart", or "base"
- PCT is a positive number (decimals allowed, e.g. 0.5, 1.5); represent small-dose materials accurately
- All pct values must sum between 95 and 115 (the full concentrate)
- Use real trade names and IUPAC names as professionals use them — never vague generics like "musk" or "wood" alone

STRUCTURE (cover all of these):
• Top accord (4–6 materials): citrus, green, aromatic, aldehydic, ozone — e.g. Bergamot, Lemon, Grapefruit, Petitgrain, Basil, Violet leaf absolute, Hedione, Calone 1951, Iso-methyl ionone
• Heart accord (8–14 materials): florals, spices, resins, phenolics — e.g. Rose oxide, Damascone Beta, Phenyl ethyl alcohol, Eugenol, Methyl laitone, Habanolide, Floralozone, Clove bud, Ylang ylang, Jasmine absolute, Geraniol, Dihydromyrcenol
• Base accord (6–10 materials): woods, musks, ambers, animalics, balsams — e.g. Clearwood, Javanol, Ambroxan, Cetalox, Cashmeran, Timberol, Norlimbanol, Galaxolide, Habanolide, Labdanum absolute, Benzyl benzoate, Ethylene brassylate, Tonalide, Iso E Super (can read top/base), Vetiver acetate, Patchouli alcohol
• Diffusants & carriers (2–4 materials): IPM, DPG, benzyl salicylate, linalool, Iso E Super — these improve radiance and projection
• Fixatives (2–3 materials): musks or resins that extend longevity — e.g. Macrocyclic musks, Evernyl methyl ether, Benzyl benzoate, Labdanum

TONE: Choose materials that genuinely serve the brief. Reflect current IFF, Givaudan, Symrise, and Firmenich catalogues — use materials that are available and widely used in professional studio work. Avoid anachronistic materials or ones that are effectively banned (HICC, musk ambrette, oakmoss above trace). Nitromusks are out. Polycyclic musks are in. For a brief that lends itself to naturals, include absolutes and CO2 extracts. For a synthetic-forward brief, lean into aroma chemicals. The blend must be coherent and serve the concept.`,
        },
        {
          role: "user",
          content: `Formula name: "${name}"\nBrief: "${brief}"\n\nCompose the material list.`,
        },
      ],
    });
  } catch (error) {
    req.log.error({ err: error, model: FORMULA_IDEAS_MODEL }, "Formula material suggestions failed");
    res.status(502).json({ error: "Material suggestions are temporarily unavailable. Please try again." });
    return;
  }

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
