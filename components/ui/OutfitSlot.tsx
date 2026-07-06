"use client";

import Image from "next/image";
import { motion } from "motion/react";
import useSWR from "swr";

export interface OutfitItem {
  label: string;
  query: string;
  type: string;
  category: "Clothing" | "UGC" | "Layered";
  note: string;
}

interface PreviewItem {
  id: number;
  name: string;
  price: number | null;
  imageUrl: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function OutfitSlot({ item, index }: { item: OutfitItem; index: number }) {
  const searchUrl = `/api/search?q=${encodeURIComponent(item.query)}&category=${encodeURIComponent(item.category)}&limit=5`;
  const { data, isLoading } = useSWR(searchUrl, fetcher);
  const previewItems: PreviewItem[] = data?.items || [];

  const categoryBadge =
    item.category === "Layered" ? "3D" : item.category === "UGC" ? "UGC" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="px-8 py-6 space-y-4 border-b border-border last:border-b-0"
    >
      {/* Slot header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
            {categoryBadge && (
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] border border-border text-muted-foreground/50 px-1.5 py-0.5 shrink-0">
                {categoryBadge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-sm">
            {item.note}
          </p>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 shrink-0 mt-0.5">
          {item.type}
        </span>
      </div>

      {/* Catalog preview */}
      {isLoading ? (
        <div className="flex gap-2.5">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="h-[72px] w-[72px] shrink-0 bg-card"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          ))}
        </div>
      ) : previewItems.length > 0 ? (
        <div className="flex gap-2.5 overflow-x-auto pb-0.5">
          {previewItems.map((catalogItem, i) => (
            <motion.a
              key={catalogItem.id}
              href={`https://www.roblox.com/catalog/${catalogItem.id}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" }}
              className="group relative h-[72px] w-[72px] shrink-0 bg-card overflow-hidden block"
              title={catalogItem.name}
            >
              <Image
                src={catalogItem.imageUrl}
                alt={catalogItem.name}
                fill
                sizes="72px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              {catalogItem.price !== null && (
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5">
                  <span className="font-mono text-[8px] text-muted-foreground/80">
                    R$ {catalogItem.price}
                  </span>
                </div>
              )}
            </motion.a>
          ))}
        </div>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/30">
          No matching items found
        </p>
      )}
    </motion.div>
  );
}
