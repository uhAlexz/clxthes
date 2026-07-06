"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, ArrowUp } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { ItemProps } from "@/components/ui/ItemCard";

interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  itemIds?: number[];
  actionsPerformed?: string[];
}

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeGroups: string[];
  catalogItems: ItemProps[];
}

type AiAction =
  | { type: "add_to_cart"; itemIds: number[] }
  | { type: "save_item"; itemIds: number[] }
  | { type: "open_item"; itemId: number };

const SUGGESTED_PROMPTS = [
  "Build me a full outfit from what's available",
  "Suggest a streetwear look using layered pieces",
  "What free items can I build an outfit with?",
  "Add a matching shirt and pants to my cart",
  "What UGC accessories would complete my cart?",
];

export function AssistantPanel({
  isOpen,
  onClose,
  activeGroups,
  catalogItems,
}: AssistantPanelProps) {
  const {
    savedItems,
    cartItems,
    addToCart,
    toggleSavedItem,
    setQuickViewItem,
    setCartDrawerOpen,
  } = useStore();

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const dispatchActions = (actions: AiAction[]): string[] => {
    const performed: string[] = [];
    for (const action of actions) {
      if (action.type === "add_to_cart" && action.itemIds?.length) {
        let added = 0;
        for (const id of action.itemIds) {
          const item = catalogItems.find((i) => i.id === id);
          if (item) { addToCart(item); added++; }
        }
        if (added > 0) {
          performed.push(`Added ${added} item${added > 1 ? "s" : ""} to cart`);
          setCartDrawerOpen(true);
        }
      }
      if (action.type === "save_item" && action.itemIds?.length) {
        let saved = 0;
        for (const id of action.itemIds) {
          const item = catalogItems.find((i) => i.id === id);
          if (item) { toggleSavedItem(item); saved++; }
        }
        if (saved > 0) {
          performed.push(`Saved ${saved} item${saved > 1 ? "s" : ""}`);
        }
      }
      if (action.type === "open_item" && action.itemId) {
        const item = catalogItems.find((i) => i.id === action.itemId);
        if (item) setQuickViewItem(item);
      }
    }
    return performed;
  };

  const handleSend = async (overrideText?: string) => {
    const content = (overrideText ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: AssistantMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build history for API (role + content only)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          context: {
            groups: activeGroups,
            items: catalogItems,
            cartItems,
            savedItems,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      const actionsPerformed = dispatchActions((data.actions ?? []) as AiAction[]);

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: "assistant",
          content: data.message ?? "",
          itemIds: data.itemIds ?? [],
          actionsPerformed,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — subtle so the catalog stays readable */}
          <motion.div
            key="assistant-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/25"
          />

          {/* Panel */}
          <motion.div
            key="assistant-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 240 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-[380px] flex-col bg-card border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-foreground">Assistant</span>
                {catalogItems.length > 0 && (
                  <span className="font-mono text-[10px] text-muted-foreground/40">
                    {catalogItems.length} items
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages / empty state */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {messages.length === 0 && !isLoading ? (
                /* Empty state — suggested prompts */
                <div className="flex flex-col justify-end h-full px-6 py-6">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Try asking
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSend(prompt)}
                          className="group text-left text-[11px] text-muted-foreground/50 hover:text-muted-foreground border border-border/50 hover:border-border px-3 py-2 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-7">
                  {messages.map((msg) => (
                    <div key={msg.id} className="space-y-2.5">
                      {/* Sender label */}
                      <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/35">
                        {msg.role === "user" ? "You" : "Assistant"}
                      </p>

                      {/* Message text */}
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {/* Item thumbnails — shown when AI references items */}
                      {msg.itemIds && msg.itemIds.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-0.5">
                          {msg.itemIds.slice(0, 6).map((id) => {
                            const item = catalogItems.find((i) => i.id === id);
                            if (!item) return null;
                            return (
                              <button
                                key={id}
                                onClick={() => setQuickViewItem(item)}
                                title={item.name}
                                className="group relative h-[56px] w-[56px] shrink-0 bg-background overflow-hidden"
                              >
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                />
                                {/* Hover overlay with price */}
                                <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-full bg-background/85 px-1 py-0.5">
                                    <span className="font-mono text-[7px] text-muted-foreground truncate block">
                                      {item.price !== null ? `R$${item.price}` : "Free"}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Action confirmation chips */}
                      {msg.actionsPerformed && msg.actionsPerformed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.actionsPerformed.map((action, i) => (
                            <span
                              key={i}
                              className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 border border-border px-2 py-0.5"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking indicator */}
                  {isLoading && (
                    <div className="space-y-2.5">
                      <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/35">
                        Assistant
                      </p>
                      <motion.p
                        className="font-mono text-sm text-muted-foreground/40"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        ...
                      </motion.p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-border px-5 py-4 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeGroups.length === 0
                      ? "Add a group to get started..."
                      : "Ask anything about your catalog..."
                  }
                  disabled={isLoading}
                  className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none disabled:opacity-40"
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  whileTap={{ scale: 0.93 }}
                  className="shrink-0 flex h-7 w-7 items-center justify-center bg-white text-black disabled:opacity-20 transition-opacity"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
