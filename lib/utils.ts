import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseRobloxId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/(?:roblox\.com\/(?:groups|communities)\/|group_id=)(\d+)/i);
  if (match?.[1]) {
    return match[1];
  }

  return null;
}


const COMMON_TAGS = [
  "Y2K", "Grunge", "Emo", "Preppy", "Casual", "Streetwear", "Vintage",
  "Cute", "Gothic", "Cyberpunk", "Anime", "Soft", "Fairy", "Cyber",
  "Techwear", "Star", "Heart", "Cross", "Skeleton", "Camo", "Denim",
  "Aesthetic", "Indie", "Retro",
];

const COLORS = [
  "Black", "White", "Red", "Blue", "Pink", "Green", "Purple", "Yellow",
  "Brown", "Grey", "Orange",
];

export function generateTags(name: string, description: string): string[] {
  const combinedText = `${name} ${description}`.toLowerCase();
  const foundTags: string[] = [];

  for (const tag of COMMON_TAGS) {
    if (combinedText.includes(tag.toLowerCase())) {
      foundTags.push(tag);
    }
  }

  for (const color of COLORS) {
    if (combinedText.includes(color.toLowerCase())) {
      foundTags.push(color);
    }
  }

  if (foundTags.length === 0) {
    if (combinedText.includes("shirt") || combinedText.includes("tee")) foundTags.push("Top");
    if (combinedText.includes("pants") || combinedText.includes("jeans")) foundTags.push("Bottom");
    if (foundTags.length === 0) foundTags.push("Casual");
  }

  return Array.from(new Set(foundTags)).slice(0, 2);
}
