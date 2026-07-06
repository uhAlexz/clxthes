import { NextResponse } from "next/server";

interface CatalogSearchItem {
  id: number;
  itemType: string;
}

interface RobloxDetailItem {
  id: number;
  name?: string;
  assetType?: number;
  price?: number;
  lowestPrice?: number;
}

interface RobloxThumbnail {
  targetId: number;
  imageUrl: string;
}

const CATEGORY_MAP: Record<string, string> = {
  Clothing: "Clothing",
  UGC: "Accessories",
  Layered: "LayeredClothing",
};

const FALLBACK_IMAGE =
  "https://tr.rbxcdn.com/18cebb1870605cb4035676db7817ebbf/420/420/Image/Png";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim();
    const category = url.searchParams.get("category") || "Clothing";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "4"), 8);

    if (!query) return NextResponse.json({ items: [] });

    const robloxCategory = CATEGORY_MAP[category] || "Clothing";

    // Search catalog by keyword
    const searchResponse = await fetch(
      `https://catalog.roblox.com/v1/search/items?keyword=${encodeURIComponent(query)}&category=${robloxCategory}&limit=${limit}&salesTypeFilter=1`
    );

    if (!searchResponse.ok) return NextResponse.json({ items: [] });

    const searchData = await searchResponse.json();
    const rawItems: CatalogSearchItem[] = searchData.data || [];

    if (rawItems.length === 0) return NextResponse.json({ items: [] });

    // Fetch item details (name, price)
    const detailsPayload = rawItems.map((item) => ({
      itemType: item.itemType,
      id: item.id,
    }));

    let detailResponse = await fetch(
      "https://catalog.roblox.com/v1/catalog/items/details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: detailsPayload }),
      }
    );

    if (detailResponse.status === 403) {
      const csrf = detailResponse.headers.get("x-csrf-token");
      if (csrf) {
        detailResponse = await fetch(
          "https://catalog.roblox.com/v1/catalog/items/details",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "x-csrf-token": csrf,
            },
            body: JSON.stringify({ items: detailsPayload }),
          }
        );
      }
    }

    const details: RobloxDetailItem[] = detailResponse.ok
      ? (await detailResponse.json()).data || []
      : [];

    if (details.length === 0) return NextResponse.json({ items: [] });

    // Fetch thumbnails (small size for preview tiles)
    const ids = details.map((d) => d.id).join(",");
    const thumbResponse = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${ids}&size=150x150&format=Png&isCircular=false`
    );

    const thumbMap = new Map<number, string>();
    if (thumbResponse.ok) {
      const thumbData = await thumbResponse.json();
      for (const t of (thumbData.data || []) as RobloxThumbnail[]) {
        thumbMap.set(t.targetId, t.imageUrl);
      }
    }

    const items = details.map((item) => ({
      id: item.id,
      name: item.name || "Untitled",
      price: item.price ?? item.lowestPrice ?? null,
      imageUrl: thumbMap.get(item.id) || FALLBACK_IMAGE,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[search] Error:", err);
    return NextResponse.json({ items: [] });
  }
}
