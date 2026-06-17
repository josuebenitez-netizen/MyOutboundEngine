import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite cold email copywriter. You write short, punchy, personalized cold emails that get replies.

You will receive:
1. A prospect's enrichment profile (title, company, OKRs, pain points, best angle, tone)
2. A product knowledge base
3. A sequence configuration defining each step's goal
4. Sender information

For each step, generate an email with:
- subject: Short, specific, no spam words. Max 8 words.
- previewText: The preview line shown in inbox. Max 12 words. Complements subject.
- body: The email body in plain text. Use {{first_name}} for personalization. Keep it conversational, not salesy.
- cta: The call-to-action sentence. Clear, low-friction ask.

CRITICAL RULES:
- Step 1 (Cold Open): 50-80 words max. Lead with their problem, not your product. No "I hope this finds you well." Reference something specific about their role/industry.
- Step 2 (Value Add): 60-100 words. Share a specific insight, stat, or framework relevant to their OKRs. Position yourself as helpful, not pitchy.
- Step 3 (Social Proof): 60-100 words. Reference a specific result with a similar company/role. Use numbers when possible.
- Step 4 (Breakup): 30-50 words max. Short. Acknowledge you might not be a fit. Leave door open.
- Never use "synergy", "leverage", "touch base", "circle back", "best-in-class", "cutting-edge", "innovative solution"
- Never start with "I" — start with "You", their company name, or an observation
- Sign off with just the sender's first name
- Write like a real human, not a marketing team

Return ONLY a JSON array of 4 objects (one per step), each with: subject, previewText, body, cta. No markdown, no backticks.`;

export async function POST(req: NextRequest) {
  try {
    const { prospect, enrichment, knowledgeBase, config } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const stepsDesc = config.steps
      .map((s: { stepNumber: number; label: string; goal: string }) =>
        `Step ${s.stepNumber} (${s.label}): ${s.goal}`
      )
      .join("\n");

    const enrichmentBlock = enrichment
      ? `ENRICHMENT:
Seniority: ${enrichment.seniority}
Likely OKRs: ${enrichment.likelyOKRs?.join("; ") || "Unknown"}
Pain Points: ${enrichment.painPoints?.join("; ") || "Unknown"}
Best Angle: ${enrichment.bestAngle || "General"}
Recommended Tone: ${enrichment.recommendedTone || "consultative"}
Icebreaker: ${enrichment.icebreaker || "N/A"}`
      : "No enrichment available — use general approach.";

    const kbBlock = knowledgeBase
      ? `PRODUCT:
${knowledgeBase.productSummary || "N/A"}
Value Props: ${(knowledgeBase.valueProps || []).map((v: { persona: string; prop: string }) => `${v.persona}: ${v.prop}`).join("; ")}
Proof Points: ${(knowledgeBase.proofPoints || []).join("; ")}`
      : "No product info — write generic outreach.";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `PROSPECT:
Name: ${prospect.first_name} ${prospect.last_name}
Title: ${prospect.title || "Unknown"}
Company: ${prospect.company || "Unknown"}
Industry: ${prospect.industry || "Unknown"}

${enrichmentBlock}

${kbBlock}

SENDER:
Name: ${config.senderName || "Team"}
Title: ${config.senderTitle || ""}
Company: ${config.companyName || ""}

SEQUENCE STEPS:
${stepsDesc}

Generate all ${config.steps.length} emails now. Return ONLY the JSON array.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "Claude API call failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    const cleaned = text.replace(/```json|```/g, "").trim();
    const steps = JSON.parse(cleaned);

    return NextResponse.json({ steps: Array.isArray(steps) ? steps : [steps] });
  } catch (error) {
    console.error("Sequence generation error:", error);
    return NextResponse.json({ error: "Failed to generate sequence" }, { status: 500 });
  }
}
