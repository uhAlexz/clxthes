"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { ItemCard, type ItemProps } from "@/components/ui/ItemCard";
import { GroupManager } from "@/components/ui/GroupManager";
import { QuickViewDrawer } from "@/components/ui/QuickViewDrawer";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { FloatingCartWidget } from "@/components/ui/FloatingCartWidget";
import { useStore } from "@/store/useStore";
import { ArrowRight } from "lucide-react";
import { parseRobloxId } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WorkspacePage() {
  const { activeGroups, addGroup, savedItems } = useStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [initialInput, setInitialInput] = useState("");

  const hasGroups = activeGroups.length > 0;
  const shouldShowSaved = showSavedOnly || (!hasGroups && savedItems.length > 0);

  const { data, error, isLoading } = useSWR(
    hasGroups ? `/api/groups?ids=${activeGroups.join(",")}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const handleInitialSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parseRobloxId(initialInput);
    if (id) {
      addGroup(id);
      setInitialInput("");
    }
  };

  const baseItems = shouldShowSaved ? savedItems : data?.items || [];

  const filteredItems = baseItems.filter((item: ItemProps) => {
    const itemName = item.name || "Untitled";
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? item.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      <QuickViewDrawer />
      <CartDrawer />
      <FloatingCartWidget />

      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold uppercase tracking-tighter">clxthes</h1>
          <button
            onClick={() => setShowSavedOnly((value) => !value)}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              showSavedOnly
                ? "border-black bg-black text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900"
            }`}
          >
            {showSavedOnly ? "View Feed" : "Saved"}
          </button>
        </div>
        {hasGroups && !showSavedOnly && <GroupManager />}
      </header>

      <main className="flex flex-1 flex-col">
        {!hasGroups && !showSavedOnly && savedItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-medium tracking-tight">Create your workspace.</h2>
                <p className="text-zinc-400">Paste a Roblox community URL or ID to begin pulling catalog items into a unified feed.</p>
              </div>
              <form onSubmit={handleInitialSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={initialInput}
                  onChange={(event) => setInitialInput(event.target.value)}
                  placeholder="https://www.roblox.com/communities/123456/..."
                  className="w-full border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 transition-colors focus:border-zinc-100 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!initialInput.trim()}
                  className="flex w-full items-center justify-center gap-2 bg-white py-3 font-bold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  Enter <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col md:flex-row">
            <aside className="flex w-full shrink-0 flex-col gap-8 border-b border-zinc-800 bg-zinc-950 p-6 md:w-64 md:border-b-0 md:border-r">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Search</h3>
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition-colors focus:border-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Category</h3>
                <div className="flex flex-col gap-2">
                  {['Clothing', 'Shirts', 'Pants', 'T-Shirts'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className={`py-1 text-left text-sm font-medium transition-colors ${
                        selectedType === type ? "text-zinc-100 underline underline-offset-4" : "text-zinc-500 hover:text-zinc-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1 bg-zinc-900/70 p-6">
              {isLoading && !data && !showSavedOnly ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {[...Array(10)].map((_, index) => (
                    <div key={index} className="aspect-square animate-pulse border border-zinc-800 bg-zinc-900" />
                  ))}
                </div>
              ) : error ? (
                <div className="border border-red-900 bg-red-950/70 p-4 font-medium text-red-300">
                  Failed to load catalog data. Try refreshing.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-zinc-400">
                  <p className="font-bold uppercase tracking-widest">No items found</p>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  <AnimatePresence>
                    {filteredItems.map((item: ItemProps, index: number) => (
                      <ItemCard key={item.id} item={item} index={index} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
