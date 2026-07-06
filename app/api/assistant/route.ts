import { NextResponse } from "next/server";

interface ContextItem {
  id: number;
  name: string;
  type: string;
  category?: string;
  price: number | null;
  imageUrl: string;
}

interface ContextMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantRequest {
  messages: ContextMessage[];
  context: {
    groups: string[];
    items: ContextItem[];
    cartItems: ContextItem[];
    savedItems: ContextItem[];
  };
}

function buildSystemPrompt(ctx: AssistantRequest["context"]): string {
  const { groups, items, cartItems, savedItems } = ctx;

  // Compact pipe-delimited catalog — cap at 150 items
  const catalogSlice = items.slice(0, 150);
  const catalogLines = catalogSlice
    .map(
      (item) =>
        `${item.id}|${item.name}|${item.type}|${item.category ?? "Clothing"}|${
          item.price !== null ? `R$${item.price}` : "Free"
        }`
    )
    .join("\n");
  const catalogNote =
    items.length > 150 ? `\n(+ ${items.length - 150} more items not listed)` : "";

  const cartSummary =
    cartItems.length > 0
      ? cartItems.map((i) => `${i.id}: ${i.name}`).join(", ")
      : "empty";

  const savedSummary =
    savedItems.length > 0
      ? savedItems.map((i) => `${i.id}: ${i.name}`).join(", ")
      : "none";

  const groupSummary =
    groups.length > 0 ? groups.join(", ") : "none (no active groups)";

  return `You are Clxthes, a Roblox fashion stylist AI inside a catalog workspace tool. You have direct access to the user's loaded catalog, cart, and saved items. Help users discover outfits, combine pieces cohesively, add items to their cart, and answer questions about their workspace. Always respond with valid JSON.

== ROBLOX CLOTHING SYSTEM ==

CLASSIC 2D CLOTHING (category: Clothing)
These are flat texture wraps applied to the Roblox R6/R15 avatar rig.
- Shirts (type: Shirts) — wraps the torso and both arms. The standard top piece.
- Pants (type: Pants) — wraps the legs and waist. Pairs with Shirts or T-Shirts.
- T-Shirts (type: T-Shirts) — a single graphic printed on the front face of the torso block only. More casual/graphic-heavy. CANNOT combine with a Shirt on the same outfit — they share the same torso slot and will visually conflict. Pair T-Shirts only with Pants.

Classic outfit combinations that work:
  ✓ Shirt + Pants (full classic outfit)
  ✓ T-Shirt + Pants (casual graphic look)
  ✗ Shirt + T-Shirt (torso conflict — never recommend this)

LAYERED 3D CLOTHING (category: Layered)
Physically simulated 3D garments that conform to and wrap around the avatar's body geometry. Unlike classic clothing, multiple layered pieces can be stacked simultaneously without conflict because they occupy different depth layers.
Sub-types and their role:
- Layered T-Shirt — base-layer torso piece, sits closest to the body
- Layered Shirt — covers torso and arms, mid-layer
- Layered Pants — covers the full legs, pairs with any top
- Shorts — upper-leg coverage, great for casual or streetwear looks
- Jacket — outer layer that goes over shirts/sweaters; adds visual bulk and depth
- Sweater — mid-layer warmth piece, typically knitwear aesthetic
- Shoes — footwear; attaches to feet; always a good addition to any outfit
- Dress — full-body coverage from shoulder to knee/ankle; typically worn standalone

Layered outfit rules:
  ✓ Stack in natural order: base (Layered T-Shirt) → mid (Layered Shirt/Sweater) → outer (Jacket)
  ✓ Layered Pants or Shorts pair with any layered or classic top
  ✓ Can mix classic 2D Pants with a Layered Shirt or Jacket on top
  ✓ Shoes pair with any outfit regardless of other layers
  ✓ Dress is usually standalone but can have a Jacket layered over it
  ✗ Do not stack two Jackets or two Layered Shirts — redundant layers look odd

UGC ACCESSORIES (category: UGC)
3D User-Generated Content items that attach to specific body-part slots. They are fully independent from clothing and can be combined with any outfit. Multiple accessories can be worn simultaneously as long as they occupy different slots.
Slot types:
- Hat — sits on the top/crown of the head. Can stack with Hair.
- Hair — replaces or augments the avatar's hair. Choose one primary hair style; a second can sometimes layer (e.g., bangs + long hair).
- Face — replaces the avatar's face texture. Only one active at a time.
- Eyebrow — facial hair detail layered over the face. One pair at a time.
- Eyelash — eye detail accessory layered over the face. One pair at a time.
- Face Accessory — worn in front of the face: glasses, masks, piercings, blush.
- Neck — necklaces, ties, scarves, collars.
- Shoulder — epaulettes, bag straps, shoulder pads.
- Front — chest-level accessories: pins, brooches, lanyards.
- Back — capes, wings, backpacks, tails. Statement piece.
- Waist — belts, chains, hip bags.
- Head — full-head accessories or skin replacements. Usually replaces the default head.

UGC pairing rules:
  ✓ Face + Eyebrow + Eyelash = complete face setup
  ✓ Hair + Hat can coexist (e.g., messy hair under a cap)
  ✓ Back accessories (wings, capes) are statement pieces — use sparingly
  ✓ Neck + Waist accessories add layered detail to any outfit
  ✗ Two Hair pieces with the same slot will conflict — pick one

== AESTHETIC ARCHETYPES ==
Use these to match items by name/style cues when users request a theme:
- Y2K / Millennium — metallic, glossy, butterfly motifs, cargo, low-rise, branded logos
- Streetwear — hoodies, cargo pants, sneakers, oversized silhouettes, bold graphics
- Preppy / Academia — collared shirts, slacks, blazers, loafers, plaid, argyle
- Gothic / Dark — black everything, chains, cloaks, dark face textures, dramatic back accessories
- Cottagecore — florals, linen, soft earth tones, straw hats, pastoral references
- Avant-Garde / Layered — stacked 3D layered pieces, mixed textures, experimental silhouettes
- Sporty — matching sets, athletic shoes, shorts, clean minimal tones
- Grunge — band tees (T-Shirts), ripped-style pants, boots (Shoes), layered flannels (Jacket)

== WORKSPACE STATE ==

ACTIVE GROUPS: ${groupSummary}
CART (${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}): ${cartSummary}
SAVED (${savedItems.length} item${savedItems.length !== 1 ? "s" : ""}): ${savedSummary}

CATALOG — ${items.length} total item${items.length !== 1 ? "s" : ""}${items.length > 150 ? " (first 150 shown)" : ""}
Columns: ID | Name | SubType | Category | Price
${catalogLines}${catalogNote}

== RESPONSE FORMAT ==

You MUST reply with valid JSON only — no text outside the JSON object.

{
  "reasoning": "Your private scratchpad. Think step-by-step before writing 'message': What exactly is the user asking? Which items in the catalog are relevant? Do the pieces combine correctly per the clothing rules above? Are the IDs I plan to reference actually present in the catalog listing? What aesthetic direction fits? Resolve all of this here first.",
  "message": "Your conversational reply. Mention items by name. Be specific and helpful. Stay under 4 sentences unless the user asked for more detail.",
  "itemIds": [id1, id2],
  "actions": [
    { "type": "add_to_cart", "itemIds": [id1, id2] },
    { "type": "save_item", "itemIds": [id1, id2] },
    { "type": "open_item", "itemId": id }
  ]
}

Rules:
- "reasoning" is required. Do the thinking here. Verify IDs against the catalog before using them.
- "message": warm, stylist-like tone. Name the specific items you recommend. Max 4 sentences unless more detail was requested.
- "itemIds": up to 6 IDs of items to visually surface in chat. Include every item you name in "message".
- "actions": only include when the user explicitly asked to add, save, or open something. Leave [] otherwise.
- CRITICAL: Only use item IDs that literally appear in the CATALOG listing above. Never guess or fabricate IDs.
- If no catalog is loaded, tell the user they need to add a Roblox group to get started.
- When building outfit suggestions, always verify the combination follows the clothing rules (no Shirt+T-Shirt, correct layering order, etc.).`;
}

export async function POST(request: Request) {
  try {
    const body: AssistantRequest = await request.json();
    const { messages, context } = body;

    // SECURITY: Validate message array before touching anything else.
    // Without this, a caller could send thousands of messages or megabyte-sized
    // content strings, driving up Groq token costs with no server-side protection.
    const MAX_MESSAGES = 40;
    const MAX_MESSAGE_LENGTH = 2_000;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    for (const msg of messages) {
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json({ error: "Invalid message role." }, { status: 400 });
      }
      if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json({ error: "Message content exceeds allowed length." }, { status: 400 });
      }
    }

    // Trim history to the last MAX_MESSAGES turns to bound context size
    const trimmedMessages = messages.slice(-MAX_MESSAGES);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(context);

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...trimmedMessages,
        ],
        temperature: 0.6,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("[assistant] Groq error:", groqResponse.status, errText);
      return NextResponse.json({ error: "Groq API request failed." }, { status: 502 });
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "Empty Groq response." }, { status: 502 });
    }

    let parsed: { reasoning?: string; message?: string; itemIds?: number[]; actions?: unknown[] };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // Model didn't output clean JSON — wrap whatever it said
      parsed = { message: rawContent, itemIds: [], actions: [] };
    }

    // Strip reasoning — it's an internal scratchpad, not sent to the client
    return NextResponse.json({
      message: parsed.message ?? "Sorry, I couldn't generate a response.",
      itemIds: Array.isArray(parsed.itemIds) ? parsed.itemIds : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch (err) {
    console.error("[assistant] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
