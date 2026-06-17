import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an A/B testing expert for cold email. Given an original email, generate two meaningfully different variants that test different hypotheses.

Each variant must change at LEAST two of these dimensions:
- Subject line strategy (question vs statement vs personalized vs curiosity gap vs number-driven)
- Body length (shorter -30% or longer +30% than original)
- CTA approach (soft ask vs hard ask vs resource offer vs social proof close vs time-bound)
- Opening hook (pain-point lead vs compliment vs industry insight vs mutual connection vs bold claim)
- Tone (more casual vs more formal vs more provocative vs more empathetic)

For each variant, return:
- variantLabel: "A" or "B"
- variantStrategy: A short description of what this variant tests differently (e.g. "Shorter body + question subject + hard CTA")
- subject: The new subject line
- previewText: The new preview text
- body: The new email body. Use {{first_name}} for personalization.
- cta: The new call-to-action

RULES:
- Variant A should be the most DIFFERENT from the original (bold changes)
- Variant B should be a moderate twist (one major change, rest similar)
- Keep the same core message/angle, just test the delivery
- Never use spam trigger words
- Keep body lengths within cold email norms (40-120 words)

Return ONLY a JSON array of 2 objects. No markdown, no backticks.`;

export async function POST(req: NextRequest) {
  try {
    const { emails, prospectName, prospectTitle, prospectCompany, stepLabels } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const allStepVariants = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const stepLabel = stepLabels[i] || `Step ${i + 1}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `PROSPECT: ${prospectName}, ${prospectTitle} at ${prospectCompany}
STEP: ${stepLabel}

ORIGINAL EMAIL:
Subject: ${email.subject}
Preview: ${email.previewText}
Body: ${email.body}
CTA: ${email.cta}

Generate 2 A/B variants. Return ONLY the JSON array.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("API error for step", i);
        allStepVariants.push([]);
        continue;
      }

      const data = await response.json();
      const text = data.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("");

      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const variants = JSON.parse(cleaned);
        allStepVariants.push(Array.isArray(variants) ? variants : [variants]);
      } catch {
        console.error("Parse error for step", i);
        allStepVariants.push([]);
      }
    }

    return NextResponse.json({ stepVariants: allStepVariants });
  } catch (error) {
    console.error("Variant generation error:", error);
    return NextResponse.json({ error: "Failed to generate variants" }, { status: 500 });
  }
}
