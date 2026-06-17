import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a premium B2B content strategist. Generate a personalized one-page diagnostic report as a complete, self-contained HTML document.

The report should feel like a high-value deliverable — something a consulting firm would charge for. It should:
1. Open with a personalized headline addressing the prospect's industry and role
2. Include 3-4 specific diagnostic findings relevant to their pain points and OKRs
3. Each finding should have a title, a brief analysis (2-3 sentences), and a recommended action
4. Include a "quick wins" section with 2-3 immediately actionable items
5. End with a soft CTA to discuss findings — not a hard sell

DESIGN REQUIREMENTS:
- Return a COMPLETE HTML document with inline CSS (no external stylesheets)
- Use a clean, modern design: white background, dark text, accent color #7C3AED (violet)
- Professional typography: system font stack
- Responsive layout that looks good on mobile and desktop
- Include a header with the sender company logo placeholder and report title
- Add a subtle footer with "Prepared for [Name] at [Company] by [Sender Company]"
- Use data visualization placeholders where relevant (simple CSS bar charts or metric cards)
- The HTML must be completely self-contained — no external dependencies

Return ONLY the HTML. No markdown, no backticks, no explanation. Start with <!DOCTYPE html>.`;

export async function POST(req: NextRequest) {
  try {
    const { prospect, enrichment, knowledgeBase, assetConfig } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const enrichmentBlock = enrichment
      ? `Seniority: ${enrichment.seniority}
OKRs: ${enrichment.likelyOKRs?.join("; ")}
Pain Points: ${enrichment.painPoints?.join("; ")}
Best Angle: ${enrichment.bestAngle}`
      : "No enrichment — use general industry analysis.";

    const kbBlock = knowledgeBase
      ? `Product: ${knowledgeBase.productSummary}
Value Props: ${(knowledgeBase.valueProps || []).map((v: { persona: string; prop: string }) => `${v.persona}: ${v.prop}`).join("; ")}
Proof Points: ${(knowledgeBase.proofPoints || []).join("; ")}`
      : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Generate a personalized diagnostic report for:

PROSPECT:
Name: ${prospect.first_name} ${prospect.last_name}
Title: ${prospect.title || "Executive"}
Company: ${prospect.company || "their company"}
Industry: ${prospect.industry || "their industry"}

${enrichmentBlock}

${kbBlock}

SENDER COMPANY: ${assetConfig?.companyName || "Our Company"}
SENDER URL: ${assetConfig?.companyUrl || ""}

Generate the complete HTML report now. Start with <!DOCTYPE html>.`,
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
    let html = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    // Clean up any markdown wrapper
    html = html.replace(/```html|```/g, "").trim();

    // Ensure it starts with DOCTYPE
    if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<!doctype")) {
      html = "<!DOCTYPE html>\n" + html;
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
