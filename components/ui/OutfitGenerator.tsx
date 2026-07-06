"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { OutfitSlot, type OutfitItem } from "@/components/ui/OutfitSlot";

interface OutfitData {
  style: string;
  description: string;
  palette: string[];
  items: OutfitItem[];
}

const EXAMPLE_PROMPTS = [
  "coquette soft girl",
  "dark academia prep",
  "cyberpunk streetwear",
  "Y2K skater",
  "old money coastal",
];

export function OutfitGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<OutfitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setOutfit(null);

    try {
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        return;
      }

      setOutfit(data);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOutfit(null);
    setError(null);
    setPrompt("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleExampleClick = (ex: string) => {
    setPrompt(ex);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <AnimatePresence mode="wait">
        {outfit ? (
          /* ── Results view ── */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col"
          >
            {/* Results header */}
            <div className="border-b border-border px-8 py-7">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2 min-w-0">
                  <h2 className="text-2xl font-medium tracking-tight leading-none">
                    {outfit.style}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {outfit.description}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-0.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  New
                </button>
              </div>

              {outfit.palette.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Palette
                  </span>
                  <div className="flex items-center gap-1">
                    {outfit.palette.map((color, i) => (
                      <span key={i} className="text-[10px] font-mono text-muted-foreground/50">
                        {color}
                        {i < outfit.palette.length - 1 && (
                          <span className="mx-1.5 opacity-30">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Outfit slots */}
            <div className="flex-1">
              {outfit.items.map((item, i) => (
                <OutfitSlot key={i} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── Input view ── */
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 items-center justify-center px-6 py-16"
          >
            <div className="w-full max-w-sm space-y-10">
              {/* Heading */}
              <div className="space-y-3">
                <h2 className="text-3xl font-medium tracking-tight">
                  Generate an outfit.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe a style, vibe, or mood. The AI finds matching Roblox
                  clothing, UGC accessories, and layered items.
                </p>
              </div>

              {/* Input form */}
              <form onSubmit={handleGenerate} className="space-y-6">
                <div
                  className={`border-b pb-3 transition-colors duration-200 ${
                    loading
                      ? "border-border"
                      : "border-border focus-within:border-foreground/40"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Y2K grunge skater..."
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-40"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground disabled:text-muted-foreground/30 transition-colors"
                >
                  {loading ? (
                    <>
                      <span>Generating</span>
                      <motion.span
                        className="font-mono text-muted-foreground/40"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        ...
                      </motion.span>
                    </>
                  ) : (
                    <>
                      <span>Generate</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
                    </>
                  )}
                </button>
              </form>

              {/* Loading placeholders */}
              {loading && (
                <div className="space-y-3 pt-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-14 w-full bg-card"
                      animate={{ opacity: [0.3, 0.5, 0.3] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.12,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-muted-foreground border-l-2 border-[#3a1a1a] pl-4 leading-relaxed">
                  {error}
                </p>
              )}

              {/* Example prompts */}
              {!loading && !error && (
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Try
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => handleExampleClick(ex)}
                        className="border border-border px-2.5 py-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground hover:border-border/80 transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
