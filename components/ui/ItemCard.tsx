"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Plus, ShoppingBag } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export interface ItemProps {
  id: number;
  name: string;
  type: string;
  price: number | null;
  imageUrl: string;
  description: string;
}

export function ItemCard({ item, index }: { item: ItemProps; index?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { toggleSavedItem, savedItems, addToCart, setQuickViewItem, setCartDrawerOpen } = useStore();

  const isSaved = savedItems.some((saved) => saved.id === item.id);
  const itemName = item.name || "Untitled";

  const handleSave = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleSavedItem(item);
    toast.success(isSaved ? "Removed from Wishlist" : "Added to Wishlist");
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    addToCart(item);
    setCartDrawerOpen(true);
    toast.success("Added to Cart", {
      icon: <ShoppingBag className="w-4 h-4" />,
    });
  };

  const handleCardClick = () => {
    setQuickViewItem(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index ? index * 0.03 : 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="group relative flex flex-col cursor-pointer border border-zinc-800 bg-zinc-900"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-zinc-800 bg-zinc-950">
        <Image
          src={item.imageUrl}
          alt={itemName}
          fill
          priority={index !== undefined && index < 10}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 20vw"
        />

        <button
          onClick={handleSave}
          className="absolute top-2 right-2 z-10 border border-zinc-800 bg-zinc-950 p-2 transition-colors hover:bg-zinc-900"
        >
          <Heart
            className="w-4 h-4 transition-colors"
            fill={isSaved ? "black" : "transparent"}
            stroke="black"
            strokeWidth={1.5}
          />
        </button>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3 right-3"
            >
              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 bg-white py-2 text-xs font-semibold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                <Plus className="w-3 h-3" />
                Add to Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {item.type}
          </span>
          <h3 className="truncate font-mono text-sm font-medium text-zinc-100">{itemName}</h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-sm font-medium text-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Robux_2019_Logo_white.svg/960px-Robux_2019_Logo_white.svg.png?_=20201227051526"
              alt="Robux"
              className="h-3 w-3 invert"
            />
            {item.price !== null ? item.price : "Off Sale"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
