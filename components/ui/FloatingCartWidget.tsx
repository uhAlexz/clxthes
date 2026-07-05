"use client";

import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useStore } from "@/store/useStore";

export function FloatingCartWidget() {
  const { cartItems, setCartDrawerOpen } = useStore();
  const itemCount = cartItems.length;

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center border border-zinc-700 bg-zinc-900 p-4 text-white"
        >
          <ShoppingBag className="h-6 w-6" />
          <motion.div
            key={itemCount}
            initial={{ scale: 0.5, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 font-mono text-xs font-bold text-zinc-100"
          >
            {itemCount}
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
