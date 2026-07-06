"use client";

import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, Heart, ShoppingBag, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { generateTags } from "@/lib/utils";

export function QuickViewDrawer() {
  const { quickViewItem, setQuickViewItem, toggleSavedItem, savedItems, addToCart, setCartDrawerOpen, assistantOpen } = useStore();

  // Computed values are null-safe so they can live outside the conditional block
  const isSaved = quickViewItem ? savedItems.some((saved) => saved.id === quickViewItem.id) : false;
  const tags = quickViewItem ? generateTags(quickViewItem.name, quickViewItem.description) : [];

  const handleClose = () => setQuickViewItem(null);

  const handleSave = () => {
    if (!quickViewItem) return;
    toggleSavedItem(quickViewItem);
    toast.success(isSaved ? "Removed from saved" : "Saved");
  };

  const handleAddToCart = () => {
    if (!quickViewItem) return;
    addToCart(quickViewItem);
    setCartDrawerOpen(true);
    toast.success("Added to cart", {
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    });
  };

  // BUG FIX: AnimatePresence must always be rendered (never behind an early return).
  // Previously `if (!quickViewItem) return null` was before the AnimatePresence, which
  // caused the component to unmount immediately, killing exit animations entirely.
  return (
    <AnimatePresence>
      {quickViewItem && (
        <>
          <motion.div
            key="qv-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 transition-[right] duration-300 ease-in-out"
            style={{ right: assistantOpen ? 380 : 0 }}
          />

          <motion.div
            key="qv-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 240 }}
            className="fixed bottom-0 top-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border overflow-y-auto transition-[right] duration-300 ease-in-out"
            style={{ right: assistantOpen ? 380 : 0 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Quick View
              </span>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative aspect-square w-full bg-background">
              {/* FIX: `priority` deprecated in Next.js 16 → use fetchPriority="high" for
                  on-demand images the user is actively viewing. preload={true} would insert
                  a <link> in <head> before we know which item will be opened — incorrect. */}
              <Image
                src={quickViewItem.imageUrl}
                alt={quickViewItem.name}
                fill
                fetchPriority="high"
                className="object-contain p-10"
                sizes="400px"
              />
            </div>

            <div className="flex flex-1 flex-col gap-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground pt-0.5">
                    {quickViewItem.type}
                  </span>
                  {(quickViewItem.category === "Layered" || quickViewItem.category === "UGC") && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] border border-border text-muted-foreground/60 px-1.5 py-0.5">
                      {quickViewItem.category === "Layered" ? "3D" : "UGC"}
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm text-foreground shrink-0">
                  {quickViewItem.price !== null ? `R$ ${quickViewItem.price}` : "Off Sale"}
                </span>
              </div>

              <h1 className="text-xl font-medium tracking-tight text-foreground leading-tight -mt-2">
                {quickViewItem.name}
              </h1>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground border border-border px-2 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {quickViewItem.description ? (
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {quickViewItem.description}
                  </p>
                </div>
              ) : null}

              <a
                href={`https://www.roblox.com/catalog/${quickViewItem.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View on Roblox
              </a>
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              <button
                onClick={handleSave}
                className={`flex items-center justify-center p-3 border transition-colors ${
                  isSaved
                    ? "border-foreground/20 bg-foreground/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
                title={isSaved ? "Remove from saved" : "Save item"}
              >
                <Heart
                  className="h-4 w-4"
                  fill={isSaved ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              </button>
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 bg-white py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#f5f5f5]"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
