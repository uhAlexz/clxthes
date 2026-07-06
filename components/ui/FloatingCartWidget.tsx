"use client";

import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useStore } from "@/store/useStore";

export function FloatingCartWidget() {
  const cartItems = useStore((s) => s.cartItems);
  const setCartDrawerOpen = useStore((s) => s.setCartDrawerOpen);
  // HYDRATION FIX: The server renders with cartItems = [] (initial state).
  // After mount, Zustand rehydrates from localStorage which may have items.
  // Without this guard, React will warn about a hydration mismatch when the
  // floating button appears on the client but was absent in the server HTML.
  const hasHydrated = useStore((s) => s._hasHydrated);

  const itemCount = cartItems.length;

  if (!hasHydrated) return null;

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-white px-4 py-2.5 text-black"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-medium">{itemCount}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
