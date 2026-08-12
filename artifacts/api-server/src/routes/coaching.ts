import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { SendCoachingMessageBody, SendCoachingMessageResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.post("/coaching/messages", async (req, res): Promise<void> => {
  const parsed = SendCoachingMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const context = parsed.data.formulaContext ? `\nCurrent formula context:\n${parsed.data.formulaContext}` : "";
  const response = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content:
          "You are Sillage Lab's senior perfumery coach. Help a perfumer make more original, emotionally specific work. Be concrete about structure, contrast, materials, dosage experiments, and evaluation. Never present safety guidance as a substitute for current IFRA documentation. Return exactly three short sections prefixed with REPLY:, SUGGESTIONS:, and CAUTIONS:. In SUGGESTIONS and CAUTIONS, separate items with a semicolon.",
      },
      { role: "user", content: `${parsed.data.message}${context}` },
    ],
  });
  const text = response.choices[0]?.message?.content ?? "Try describing the emotional temperature you want the fragrance to leave behind.";
  const reply = text.match(/REPLY:\s*([\s\S]*?)(?:SUGGESTIONS:|$)/i)?.[1]?.trim() || text;
  const suggestionsText = text.match(/SUGGESTIONS:\s*([\s\S]*?)(?:CAUTIONS:|$)/i)?.[1]?.trim() || "";
  const cautionsText = text.match(/CAUTIONS:\s*([\s\S]*)/i)?.[1]?.trim() || "Confirm current IFRA limits and supplier allergen declarations before release.";
  res.json(
    SendCoachingMessageResponse.parse({
      reply,
      suggestions: suggestionsText.split(";").map((item: string) => item.trim()).filter(Boolean),
      cautions: cautionsText.split(";").map((item: string) => item.trim()).filter(Boolean),
    }),
  );
});

export default router;