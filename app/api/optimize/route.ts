import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a cold email optimization expert. Given campaign results data, analyze performance patterns and provide actionable recommendations.

Return ONLY a JSON object with this exact structure — no markdown, no backticks:

{
  "summary": "2-3 sentence executive summary of overall performance and key takeaway",
  "winningPatterns": [
    {
      "category": "Subject Line | Body Length | CTA | Tone | Industry | Seniority | Step | Variant",
      "finding": "Specific pattern that's working well with data to back it up",
      "action": "How to double down on this",
      "confidence": "high | medium | low",
      "impact": "high | medium | low"
    }
  ],
  "losingPatterns": [
    {
      "category": "Same categories as above",
      "finding": "Specific pattern that's underperforming",
      "action": "What to change",
      "confidence": "high | medium | low",
      "impact": "high | medium | low"
    }
  ],
  "nextGenRecommendations": [
    "Specific, actionable recommendation for next batch of emails — be very specific about what to write"
  ],
  "retireList": [
    "Specific subject line, CTA, or approach to stop using"
  ]
}

Rules:
- Include 3-5 winning patterns sorted by impact
- Include 2-4 losing patterns sorted by impact
- Include 3-5 next-gen recommendations that are specific enough to act on immediately
- Include 1-3 items to retire
- Base all findings on the actual data, not assumptions
- If sample size is small, note low confidence
- Focus on actionable insights, not obvious observations`;

export async function POST(req: NextRequest) {
  try {
    const { results, knowledgeBase } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    // Compute aggregate stats
    const total = results.length;
    const opened = results.filter((r: { opened: boolean }) => r.opened).length;
    const replied = results.filter((r: { replied: boolean }) => r.replied).length;
    const positive = results.filter((r: { positiveReply: boolean }) => r.positiveReply).length;
    const booked = results.filter((r: { booked: boolean }) => r.booked).length;

    // Build breakdown strings
    const byStep = [1, 2, 3, 4].map((step) => {
      const stepResults = results.filter((r: { step: number }) => r.step === step);
      const stepOpened = stepResults.filter((r: { opened: boolean }) => r.opened).length;
      const stepReplied = stepResults.filter((r: { replied: boolean }) => r.replied).length;
      return `Step ${step}: ${stepResults.length} sent, ${stepOpened} opened (${stepResults.length > 0 ? Math.round((stepOpened / stepResults.length) * 100) : 0}%), ${stepReplied} replied`;
    }).join("\n");

    const byVariant = ["original", "A", "B"].map((v) => {
      const vResults = results.filter((r: { variant: string }) => r.variant === v);
      const vOpened = vResults.filter((r: { opened: boolean }) => r.opened).length;
      const vReplied = vResults.filter((r: { replied: boolean }) => r.replied).length;
      const vPositive = vResults.filter((r: { positiveReply: boolean }) => r.positiveReply).length;
      return `${v}: ${vResults.length} sent, ${vOpened} opened, ${vReplied} replied, ${vPositive} positive`;
    }).join("\n");

    // Sample of actual subject lines and their performance
    const subjectSample = results
      .slice(0, 30)
      .map((r: { subjectLine: string; opened: boolean; replied: boolean; positiveReply: boolean; step: number; variant: string; industry: string; title: string; bodyWordCount: number }) =>
        `"${r.subjectLine}" [step${r.step}/${r.variant}] ${r.industry}/${r.title} — ${r.bodyWordCount}w — opened:${r.opened} replied:${r.replied} positive:${r.positiveReply}`
      )
      .join("\n");

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
            content: `CAMPAIGN RESULTS:
Total sends: ${total}
Opens: ${opened} (${total > 0 ? Math.round((opened / total) * 100) : 0}%)
Replies: ${replied} (${total > 0 ? Math.round((replied / total) * 100) : 0}%)
Positive replies: ${positive} (${total > 0 ? ((positive / total) * 100).toFixed(1) : 0}%)
Meetings booked: ${booked}

BY STEP:
${byStep}

BY VARIANT:
${byVariant}

SAMPLE EMAILS WITH PERFORMANCE:
${subjectSample}

PRODUCT CONTEXT:
${knowledgeBase?.productSummary || "N/A"}

Analyze these results and return the optimization JSON.`,
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
    const report = JSON.parse(cleaned);

    return NextResponse.json({ report: { ...report, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "Failed to analyze results" }, { status: 500 });
  }
}
