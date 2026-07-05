"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, Trash2, ExternalLink, Check, ShoppingBag, ArrowLeft } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen, cartItems, removeFromCart, clearCart } = useStore();
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<number>>(new Set());

  if (!cartDrawerOpen) return null;

  const handleClose = () => {
    setCartDrawerOpen(false);
    window.setTimeout(() => setCheckoutMode(false), 300);
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
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            {checkoutMode && (
              <button onClick={() => setCheckoutMode(false)} className="rounded-full p-1 transition-colors hover:bg-zinc-200">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest text-zinc-100">
              {checkoutMode ? "Checkout Checklist" : "Your Cart"}
              {!checkoutMode && <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-950">{cartItems.length}</span>}
            </h2>
          </div>
          <button onClick={handleClose} className="rounded-full p-2 transition-colors hover:bg-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-400">
              <ShoppingBag className="h-12 w-12" />
              <p className="font-mono text-sm uppercase tracking-widest">Cart is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cartItems.map((item) => {
                const isPurchased = purchasedIds.has(item.id);

                return (
                  <motion.div
                    layout
                    key={item.id}
                    className="group relative flex items-center gap-4 border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 border border-zinc-800 bg-zinc-950">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate font-mono text-sm font-medium text-zinc-100">{item.name}</h3>
                      <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-500">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Robux_2019_Logo_white.svg/960px-Robux_2019_Logo_white.svg.png?_=20201227051526"
                          alt="Robux"
                          className="h-3 w-3 invert opacity-50"
                        />
                        {item.price !== null ? item.price : "Off Sale"}
                      </div>
                    </div>

                    {!checkoutMode ? (
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="shrink-0 p-2 text-zinc-400 transition-colors hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <a
                        href={`https://www.roblox.com/catalog/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handlePurchaseClick(item.id)}
                        className={`flex shrink-0 items-center gap-2 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                          isPurchased ? "border-green-900 bg-green-950/70 text-green-300" : "border-white bg-white text-zinc-950 hover:bg-zinc-200"
                        }`}
                      >
                        {isPurchased ? <Check className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
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
          <div className="flex flex-col gap-4 border-t border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between font-mono text-lg font-bold text-zinc-900">
              <span className="text-sm uppercase tracking-widest text-zinc-500">Total</span>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Robux_2019_Logo_white.svg/960px-Robux_2019_Logo_white.svg.png?_=20201227051526"
                  alt="Robux"
                  className="h-5 w-5 invert"
                />
                {totalRobux}
              </div>
            </div>

            {!checkoutMode ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearCart();
                    toast.success("Cart cleared");
                  }}
                  className="border border-zinc-800 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors hover:bg-zinc-800"
                >
                  Clear
                </button>
                <button
                  onClick={() => setCheckoutMode(true)}
                  className="flex-1 bg-white py-3 font-mono text-sm font-bold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="mb-2 text-center font-mono text-xs text-zinc-500">
                  Roblox does not support external multi-item checkout. Click &quot;Buy&quot; to open each item in a new tab, then check it off here.
                </p>
                <button
                  onClick={() => {
                    clearCart();
                    setCheckoutMode(false);
                    setCartDrawerOpen(false);
                    toast.success("Thanks for shopping!");
                  }}
                  className="flex w-full items-center justify-center gap-2 bg-green-600 py-3 font-mono text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-green-500"
                >
                  <Check className="h-5 w-5" />
                  Finish & Clear Cart
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
