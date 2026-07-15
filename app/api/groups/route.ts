import { NextResponse } from "next/server";

interface CatalogItem {
  id: number;
  itemType: string;
}

interface RobloxDetailItem {
  id: number;
  name?: string;
  assetType?: number;
  price?: number;
  lowestPrice?: number;
  description?: string;
}

interface RobloxThumbnail {
  targetId: number;
  imageUrl: string;
}

// 2D classic clothing
const CLASSIC_CLOTHING: Record<number, string> = {
  2: "T-Shirts",
  11: "Shirts",
  12: "Pants",
};

// 3D layered clothing (assetType 69–77)
const LAYERED_CLOTHING: Record<number, string> = {
  69: "Layered T-Shirt",
  70: "Layered Shirt",
  71: "Layered Pants",
  72: "Jacket",
  73: "Sweater",
  74: "Shorts",
  75: "Shoes",
  76: "Shoes",
  77: "Dress",
};

// UGC accessories
const UGC_ACCESSORIES: Record<number, string> = {
  8: "Hat",
  17: "Head",
  18: "Face",
  41: "Hair",
  42: "Face Accessory",
  43: "Neck",
  44: "Shoulder",
  45: "Front",
  46: "Back",
  47: "Waist",
  64: "Eyebrow",
  65: "Eyelash",
};

const LAYERED_SET = new Set(Object.keys(LAYERED_CLOTHING).map(Number));
const UGC_SET = new Set(Object.keys(UGC_ACCESSORIES).map(Number));

function toItemType(assetType?: number): string {
  if (!assetType) return "Clothing";
  return (
    CLASSIC_CLOTHING[assetType] ??
    LAYERED_CLOTHING[assetType] ??
    UGC_ACCESSORIES[assetType] ??
    "Clothing"
  );
}

function toItemCategory(assetType?: number): "Clothing" | "UGC" | "Layered" {
  if (!assetType) return "Clothing";
  if (LAYERED_SET.has(assetType)) return "Layered";
  if (UGC_SET.has(assetType)) return "UGC";
  return "Clothing";
}

async function fetchCatalogItems(groupId: string, category: string): Promise<CatalogItem[]> {
  try {
    const response = await fetch(
      `https://catalog.roblox.com/v1/search/items?category=${category}&creatorTargetId=${groupId}&creatorType=Group&limit=120`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []) as CatalogItem[];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ items: [] });
    }

    // SECURITY: Validate that every supplied ID is a pure numeric string.
    // The client-side parseRobloxId() already enforces this, but a malicious
    // caller could bypass the client entirely and supply arbitrary strings that
    // get interpolated into Roblox API URLs.
    const MAX_GROUPS = 10;
    const groupIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d{1,20}$/.test(id)) // numeric-only, reasonable length cap
      .slice(0, MAX_GROUPS);               // cap concurrent group requests

    if (groupIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Fetch from Clothing, Accessories, and LayeredClothing categories in parallel
    const catalogResults = await Promise.allSettled(
      groupIds.flatMap((id) => [
        fetchCatalogItems(id, "Clothing"),
        fetchCatalogItems(id, "Accessories"),
        fetchCatalogItems(id, "LayeredClothing"),
      ])
    );

    const allRawItems: CatalogItem[] = [];
    for (const result of catalogResults) {
      if (result.status === "fulfilled") {
        allRawItems.push(...result.value);
      }
    }

    const uniqueRawItems = Array.from(
      new Map(allRawItems.map((item) => [item.id, item])).values()
    );

    if (uniqueRawItems.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const detailChunks: Array<Array<CatalogItem>> = [];
    for (let index = 0; index < uniqueRawItems.length; index += 100) {
      detailChunks.push(uniqueRawItems.slice(index, index + 100));
    }

    const detailResults = await Promise.allSettled(
      detailChunks.map(async (chunk) => {
        const detailsPayload = chunk.map((item) => ({
          itemType: item.itemType,
          id: item.id,
        }));

        let response = await fetch("https://catalog.roblox.com/v1/catalog/items/details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ items: detailsPayload }),
        });

        if (response.status === 403) {
          const csrfToken = response.headers.get("x-csrf-token");
          if (csrfToken) {
            response = await fetch("https://catalog.roblox.com/v1/catalog/items/details", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "x-csrf-token": csrfToken,
              },
              body: JSON.stringify({ items: detailsPayload }),
            });
          }
        }

        if (!response.ok) {
          return [] as RobloxDetailItem[];
        }

        const detailsData = await response.json();
        return (detailsData.data || []) as RobloxDetailItem[];
      })
    );

    const allDetails: RobloxDetailItem[] = [];
    for (const result of detailResults) {
      if (result.status === "fulfilled") {
        allDetails.push(...result.value);
      }
    }

    if (allDetails.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const thumbnailChunks: Array<Array<RobloxDetailItem>> = [];
    for (let index = 0; index < allDetails.length; index += 100) {
      thumbnailChunks.push(allDetails.slice(index, index + 100));
    }

    const thumbnailResults = await Promise.allSettled(
      thumbnailChunks.map(async (chunk) => {
        const itemIdsStr = chunk.map((item) => item.id).join(",");
        const thumbnailsResponse = await fetch(
          `https://thumbnails.roblox.com/v1/assets?assetIds=${itemIdsStr}&size=420x420&format=Png&isCircular=false`
        );

        if (!thumbnailsResponse.ok) {
          return [] as RobloxThumbnail[];
        }

        const thumbnailsData = await thumbnailsResponse.json();
        return (thumbnailsData.data || []) as RobloxThumbnail[];
      })
    );

    const thumbnailMap = new Map<number, string>();
    for (const result of thumbnailResults) {
      if (result.status === "fulfilled") {
        for (const thumbnail of result.value) {
          thumbnailMap.set(thumbnail.targetId, thumbnail.imageUrl);
        }
      }
    }

    const mergedItems = allDetails
      .map((item) => ({
        id: item.id,
        name: item.name || "Untitled",
        type: toItemType(item.assetType),
        category: toItemCategory(item.assetType),
        price: item.price ?? item.lowestPrice ?? null,
        description: item.description || "",
        imageUrl:
          thumbnailMap.get(item.id) ||
          "https://tr.rbxcdn.com/18cebb1870605cb4035676db7817ebbf/420/420/Image/Png",
      }))
      .sort((left, right) => {
        const priceDelta = (right.price ?? 0) - (left.price ?? 0);
        if (priceDelta !== 0) return priceDelta;
        return left.name.localeCompare(right.name);
      });

    // Cache the assembled catalog for 30 minutes at the CDN/edge layer.
    // The client requests one group per URL, so cache keys are stable per
    // group and this shields Roblox from redundant fan-out across all users.
    return NextResponse.json({ items: mergedItems }, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
