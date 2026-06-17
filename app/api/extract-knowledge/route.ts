import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an expert at analyzing product/service information and extracting structured knowledge for outbound sales.

Given the user's input about their product or service, extract and return a JSON object with exactly this structure:

{
  "productSummary": "2-3 sentence summary of what the product/service does and who it's for",
  "icp": "Detailed ideal customer profile: industry, company size, titles, geography, pain points",
  "valueProps": [
    { "persona": "VP of Sales", "prop": "Specific value proposition for this persona" },
    { "persona": "Head of Marketing", "prop": "Specific value proposition for this persona" }
  ],
  "proofPoints": [
    "Specific proof point, case study, or metric",
    "Another proof point"
  ],
  "objections": [
    { "objection": "Common objection prospects raise", "response": "How to handle it" }
  ]
}

Rules:
- Include 3-5 value props for different personas
- Include 3-6 proof points
- Include 3-5 common objections with responses
- Be specific, not generic. Use the actual product details provided.
- If information is missing, make reasonable inferences based on what's given and mark them with [inferred]
- Return ONLY the JSON object, no markdown, no backticks, no explanation`;

export async function POST(req: NextRequest) {
  try {
    const { context } = await req.json();

    if (!context || context.trim().length === 0) {
      return NextResponse.json(
        { error: "No context provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

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
            content: `Here is everything I know about my product/service. Extract a structured knowledge base from this:\n\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json(
        { error: "Failed to call Claude API" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("");

    // Clean and parse
    const cleaned = text.replace(/```json|```/g, "").trim();
    const knowledgeBase = JSON.parse(cleaned);

    return NextResponse.json({ knowledgeBase });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract knowledge base" },
      { status: 500 }
    );
  }
}
