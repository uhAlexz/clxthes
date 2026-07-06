"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShoppingBag } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export interface ItemProps {
  id: number;
  name: string;
  type: string;
  category?: "Clothing" | "UGC" | "Layered";
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
    toast.success(isSaved ? "Removed from Saved" : "Saved");
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    addToCart(item);
    setCartDrawerOpen(true);
    toast.success("Added to cart", {
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    });
  };

  const handleCardClick = () => {
    setQuickViewItem(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.45,
        delay: index !== undefined ? Math.min(index * 0.025, 0.3) : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className="group relative flex flex-col cursor-pointer bg-card"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#0c0c0c]">
        <Image
          src={item.imageUrl}
          alt={itemName}
          fill
          fetchPriority={index !== undefined && index < 10 ? "high" : "auto"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 20vw"
        />

        {(item.category === "Layered" || item.category === "UGC") && (
          <div className="absolute top-2 left-2 z-10">
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-foreground/50 bg-background/75 px-1.5 py-0.5">
              {item.category === "Layered" ? "3D" : "UGC"}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title={isSaved ? "Remove from saved" : "Save item"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isSaved ? "text-white fill-white" : "text-white/60"
            }`}
            strokeWidth={1.5}
          />
        </button>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0"
            >
              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-1.5 bg-white py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-black transition-colors hover:bg-[#f5f5f5]"
              >
                Add to Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {item.type}
        </p>
        <h3 className="text-xs font-medium text-foreground truncate leading-tight mb-1.5">
          {itemName}
        </h3>
        <p className="font-mono text-[10px] text-muted-foreground">
          {item.price !== null ? `R$ ${item.price}` : "Off Sale"}
        </p>
      </div>
    </motion.div>
  );
}
