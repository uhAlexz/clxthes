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

function toItemType(assetType?: number): string {
  if (assetType === 11) return "Shirts";
  if (assetType === 12) return "Pants";
  if (assetType === 2) return "T-Shirts";
  return "Clothing";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ items: [] });
    }

    const groupIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (groupIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const catalogResults = await Promise.allSettled(
      groupIds.map(async (id) => {
        const response = await fetch(
          `https://catalog.roblox.com/v1/search/items?category=Clothing&creatorTargetId=${id}&creatorType=Group&limit=100`
        );

        if (!response.ok) {
          return [] as CatalogItem[];
        }

        const data = await response.json();
        return (data.data || []) as CatalogItem[];
      })
    );

    const allRawItems: CatalogItem[] = [];
    for (const result of catalogResults) {
      if (result.status === "fulfilled") {
        allRawItems.push(...result.value);
      }
    }

    const uniqueRawItems = Array.from(new Map(allRawItems.map((item) => [item.id, item])).values());

    if (uniqueRawItems.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const detailChunks = [] as Array<Array<CatalogItem>>;
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

    const thumbnailChunks = [] as Array<Array<RobloxDetailItem>>;
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
        price: item.price ?? item.lowestPrice ?? null,
        description: item.description || "",
        imageUrl:
          thumbnailMap.get(item.id) ||
          "https://tr.rbxcdn.com/18cebb1870605cb4035676db7817ebbf/420/420/Image/Png",
      }))
      .sort((left, right) => {
        const priceDelta = (right.price ?? 0) - (left.price ?? 0);
        if (priceDelta !== 0) {
          return priceDelta;
        }
        return left.name.localeCompare(right.name);
      });

    return NextResponse.json({ items: mergedItems });
  } catch (error: unknown) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
