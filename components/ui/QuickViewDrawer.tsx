"use client";

import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, Heart, ShoppingBag, ExternalLink } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { generateTags } from "@/lib/utils";

export function QuickViewDrawer() {
  const { quickViewItem, setQuickViewItem, toggleSavedItem, savedItems, addToCart, setCartDrawerOpen } = useStore();

  if (!quickViewItem) return null;

  const isSaved = savedItems.some((saved) => saved.id === quickViewItem.id);
  const tags = generateTags(quickViewItem.name, quickViewItem.description);

  const handleClose = () => {
    setQuickViewItem(null);
  };

  const handleSave = () => {
    toggleSavedItem(quickViewItem);
    toast.success(isSaved ? "Removed from Wishlist" : "Added to Wishlist");
  };

  const handleAddToCart = () => {
    addToCart(quickViewItem);
    setCartDrawerOpen(true);
    toast.success("Added to Cart", {
      icon: <ShoppingBag className="w-4 h-4" />,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-black/70"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-zinc-800 bg-zinc-950"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 p-4 backdrop-blur-sm">
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-100">Quick View</h2>
          <button onClick={handleClose} className="rounded-full p-2 transition-colors hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-square w-full border-b border-zinc-800 bg-zinc-900">
          <Image
            src={quickViewItem.imageUrl}
            alt={quickViewItem.name}
            fill
            className="object-contain p-8"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{quickViewItem.type}</span>
              <div className="flex items-center gap-1.5 font-mono text-lg font-medium text-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Robux_2019_Logo_white.svg/960px-Robux_2019_Logo_white.svg.png?_=20201227051526"
                  alt="Robux"
                  className="h-4 w-4 invert"
                />
                {quickViewItem.price !== null ? quickViewItem.price : "Off Sale"}
              </div>
            </div>
            <h1 className="font-mono text-2xl font-medium text-zinc-100">{quickViewItem.name}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs font-medium text-zinc-300">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Description</h3>
            <p className="whitespace-pre-wrap border border-zinc-800 bg-zinc-900 p-4 font-mono text-sm leading-relaxed text-zinc-400">
              {quickViewItem.description || "No description provided."}
            </p>
          </div>

          <a
            href={`https://www.roblox.com/catalog/${quickViewItem.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-sm text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ExternalLink className="h-4 w-4" />
            View Original on Roblox
          </a>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-zinc-800 bg-zinc-950 p-4">
          <button
            onClick={handleSave}
            className="flex items-center justify-center border border-zinc-800 p-4 transition-colors hover:bg-zinc-900"
            title="Save to Wishlist"
          >
            <Heart
              className="h-6 w-6 transition-colors"
              fill={isSaved ? "black" : "transparent"}
              stroke="black"
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={handleAddToCart}
            className="flex flex-grow items-center justify-center gap-2 bg-white font-mono text-sm font-bold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            <ShoppingBag className="h-5 w-5" />
            Add to Cart
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
