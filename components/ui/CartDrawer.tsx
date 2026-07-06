"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, ExternalLink, Check, ShoppingBag, ArrowLeft } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen, cartItems, removeFromCart, clearCart, assistantOpen } = useStore();
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<number>>(new Set());

  // BUG FIX 1: AnimatePresence must always be rendered — the early return
  // `if (!cartDrawerOpen) return null` was placed before the AnimatePresence,
  // so the component unmounted immediately and exit animations never played.
  // The fix: remove the early return and control rendering inside AnimatePresence.
  //
  // BUG FIX 2: Reset checkout state after the drawer's exit animation finishes.
  // Previously this was `window.setTimeout(...)` (a) using window unnecessarily
  // and (b) in handleClose rather than in an effect, which meant the timeout
  // was un-clearable on rapid open/close cycles.
  useEffect(() => {
    if (!cartDrawerOpen) {
      const t = setTimeout(() => {
        setCheckoutMode(false);
        setPurchasedIds(new Set());
      }, 300); // 300ms matches the spring exit animation duration
      return () => clearTimeout(t);
    }
  }, [cartDrawerOpen]);

  const handleClose = () => {
    setCartDrawerOpen(false);
  };

  const totalRobux = cartItems.reduce((acc, item) => acc + (item.price || 0), 0);

  const handlePurchaseClick = (id: number) => {
    setPurchasedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 transition-[right] duration-300 ease-in-out"
            style={{ right: assistantOpen ? 380 : 0 }}
          />

          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 240 }}
            className="fixed bottom-0 top-0 z-50 flex w-full max-w-sm flex-col bg-card border-l border-border transition-[right] duration-300 ease-in-out"
            style={{ right: assistantOpen ? 380 : 0 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                {checkoutMode && (
                  <button
                    onClick={() => setCheckoutMode(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {checkoutMode ? "Checkout" : "Cart"}
                  </span>
                  {!checkoutMode && cartItems.length > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground/50">
                      ({cartItems.length})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 opacity-20" />
                  <span className="text-[10px] uppercase tracking-[0.22em]">Cart is empty</span>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cartItems.map((item) => {
                    const isPurchased = purchasedIds.has(item.id);

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="relative h-11 w-11 shrink-0 bg-background">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <h3 className="truncate text-xs font-medium text-foreground">
                            {item.name}
                          </h3>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.price !== null ? `R$ ${item.price}` : "Off Sale"}
                          </span>
                        </div>

                        {!checkoutMode ? (
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <a
                            href={`https://www.roblox.com/catalog/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handlePurchaseClick(item.id)}
                            className={`flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-colors ${
                              isPurchased
                                ? "border-[#1a3a1a] bg-[#0d1f0d] text-[#4ade80]"
                                : "border-white bg-white text-black hover:bg-[#f5f5f5]"
                            }`}
                          >
                            {isPurchased ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <ExternalLink className="h-3 w-3" />
                            )}
                            {isPurchased ? "Done" : "Buy"}
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-border px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Total
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    R$ {totalRobux}
                  </span>
                </div>

                {!checkoutMode ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        clearCart();
                        toast.success("Cart cleared");
                      }}
                      className="border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setCheckoutMode(true)}
                      className="flex-1 bg-white py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] text-black hover:bg-[#f5f5f5] transition-colors"
                    >
                      Checkout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Roblox doesn&apos;t support external multi-item checkout. Open each item, purchase it, then mark it done.
                    </p>
                    <button
                      onClick={() => {
                        clearCart();
                        setCheckoutMode(false);
                        setCartDrawerOpen(false);
                        toast.success("Thanks for shopping!");
                      }}
                      className="flex w-full items-center justify-center gap-2 bg-[#14532d] py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] text-white hover:bg-[#166534] transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Finish & Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
