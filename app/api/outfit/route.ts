import { NextResponse } from "next/server";
import { outfitLimiter, getIp } from "@/lib/ratelimit";

const SYSTEM_PROMPT = `You are a Roblox fashion stylist and outfit curator. Your job is to generate complete outfit concepts with precise Roblox catalog search terms.

Roblox item categories:
- Clothing: Classic 2D wearables — Shirts, Pants, T-Shirts
- UGC: User-generated accessories — Hat, Hair, Face Accessory, Neck, Shoulder, Back, Waist
- Layered: 3D layered clothing that drapes realistically — Jacket, Sweater, Shorts, Shoes, Dress, Layered Shirt, Layered Pants

Search query tips:
- Use keywords that community creators actually name their items (e.g. "y2k cargo", "soft girl bow", "dark aesthetic hoodie")
- Be specific: favor 2-4 word phrases over single words
- Consider that most Roblox items are community-made and named colloquially

Respond ONLY with valid JSON matching this exact structure:
{
  "style": "2–4 word style name",
  "description": "Two evocative sentences describing the aesthetic mood and silhouette.",
  "palette": ["color1", "color2", "color3"],
  "items": [
    {
      "label": "Item category label (e.g. Graphic Tee, Cargo Pants, Beanie)",
      "query": "specific roblox catalog search keywords",
      "type": "Shirts|Pants|T-Shirts|Hat|Hair|Face Accessory|Jacket|Sweater|Shorts|Shoes|Dress|Layered Shirt|Layered Pants",
      "category": "Clothing|UGC|Layered",
      "note": "One styling tip or what to look for when browsing"
    }
  ]
}

Generate exactly 5 items that form a complete, cohesive outfit. Include at least one UGC accessory and one Layered or Clothing piece. Make the style feel specific and deliberate, not generic.`;

export async function POST(request: Request) {
  try {
    // ── Rate limiting ── fail fast before body parsing
    if (outfitLimiter) {
      const ip = getIp(request);
      const { success, limit, remaining, reset } = await outfitLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(limit),
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
            },
          }
        );
      }
    }

    const body = await request.json();
    const { prompt } = body;

    const MAX_PROMPT_LENGTH = 300;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    // SECURITY: Cap prompt length to prevent prompt-injection / token abuse.
    if (prompt.trim().length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured. Add it to .env.local." },
        { status: 500 }
      );
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.8,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("[outfit] Groq API error:", groqResponse.status, errText);
      return NextResponse.json({ error: "Groq API request failed." }, { status: 502 });
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Groq returned an empty response." }, { status: 502 });
    }

    const outfit = JSON.parse(content);
    return NextResponse.json(outfit);
  } catch (err) {
    console.error("[outfit] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
