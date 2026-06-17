import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert sales strategist. Given a prospect's details and a product knowledge base, analyze the prospect and return enrichment data.

Return ONLY a JSON object with this exact structure — no markdown, no backticks, no explanation:

{
  "seniority": "C-Suite" | "VP" | "Director" | "Manager" | "IC" | "Unknown",
  "likelyOKRs": ["2-3 OKRs this person likely owns based on their title and industry"],
  "painPoints": ["2-3 specific pain points they likely face"],
  "bestAngle": "The single strongest value prop to lead with for this person, referencing the product",
  "recommendedTone": "direct" | "consultative" | "peer" | "respectful",
  "toneRationale": "One sentence explaining why this tone fits",
  "icebreaker": "A specific, non-generic opening hook for this person"
}

Rules:
- Infer seniority from title. VP/SVP/EVP = VP. Director/Sr Director = Director. Manager/Sr Manager = Manager. Individual contributors = IC.
- OKRs should be specific to their title+industry, not generic business goals.
- bestAngle must reference the actual product from the knowledge base.
- icebreaker should reference their industry, company, or role — never "I hope this finds you well."
- Be specific. Generic = useless.`;

export async function POST(req: NextRequest) {
  try {
    const { prospects, knowledgeBase } = await req.json();

    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return NextResponse.json({ error: "No prospects provided" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const kbSummary = knowledgeBase
      ? `Product: ${knowledgeBase.productSummary || "N/A"}
ICP: ${knowledgeBase.icp || "N/A"}
Value Props: ${(knowledgeBase.valueProps || []).map((v: { persona: string; prop: string }) => `${v.persona}: ${v.prop}`).join("; ")}
Proof Points: ${(knowledgeBase.proofPoints || []).join("; ")}`
      : "No product knowledge base provided — make reasonable inferences.";

    // Process in batches of up to 5 at a time
    const batchSize = Math.min(prospects.length, 5);
    const prospectBlock = prospects
      .slice(0, batchSize)
      .map(
        (p: Record<string, string>, i: number) =>
          `PROSPECT ${i + 1}:
Name: ${p.first_name || ""} ${p.last_name || ""}
Title: ${p.title || "Unknown"}
Company: ${p.company || "Unknown"}
Industry: ${p.industry || "Unknown"}`
      )
      .join("\n\n");

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
            content: `KNOWLEDGE BASE:
${kbSummary}

${prospectBlock}

Return a JSON array with one enrichment object per prospect, in the same order. Return ONLY the JSON array.`,
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
    const enrichments = JSON.parse(cleaned);

    // Normalize: if single object returned for batch of 1, wrap in array
    const results = Array.isArray(enrichments) ? enrichments : [enrichments];

    return NextResponse.json({ enrichments: results });
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json({ error: "Failed to enrich prospects" }, { status: 500 });
  }
}
