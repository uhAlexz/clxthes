"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import { ItemCard, type ItemProps } from "@/components/ui/ItemCard";
import { GroupManager } from "@/components/ui/GroupManager";
import { QuickViewDrawer } from "@/components/ui/QuickViewDrawer";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { FloatingCartWidget } from "@/components/ui/FloatingCartWidget";
import { AssistantPanel } from "@/components/ui/AssistantPanel";
import { useStore } from "@/store/useStore";
import { ArrowRight, Plus } from "lucide-react";
import { parseRobloxId } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CLOTHING_FILTERS: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  { label: "Shirts", value: "Shirts" },
  { label: "Pants", value: "Pants" },
  { label: "T-Shirts", value: "T-Shirts" },
];

const EXTENDED_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Accessories", value: "Accessories" },
  { label: "Layered", value: "Layered" },
];

export default function WorkspacePage() {
  const { activeGroups, addGroup, savedItems, assistantOpen, setAssistantOpen } = useStore();

  // View state
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Form state
  const [initialInput, setInitialInput] = useState("");
  const [sidebarGroupInput, setSidebarGroupInput] = useState("");

  const hasGroups = activeGroups.length > 0;
  const shouldShowSaved = showSavedOnly || (!hasGroups && savedItems.length > 0);
  const isEmptyState = !hasGroups && !showSavedOnly && savedItems.length === 0;

  const { data, error, isLoading } = useSWR(
    hasGroups ? `/api/groups?ids=${activeGroups.join(",")}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const catalogItems: ItemProps[] = data?.items || [];

  // Hero form — first group add
  const handleInitialSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parseRobloxId(initialInput);
    if (id) {
      addGroup(id);
      setInitialInput("");
    }
  };

  // Sidebar form — add group when already in workspace but no active groups
  const handleSidebarGroupAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parseRobloxId(sidebarGroupInput);
    if (!id) {
      toast.error("Invalid Roblox group URL or ID");
      return;
    }
    addGroup(id);
    setSidebarGroupInput("");
    setShowSavedOnly(false);
    toast.success("Group added");
  };

  const baseItems = shouldShowSaved ? savedItems : catalogItems;

  const filteredItems = baseItems.filter((item: ItemProps) => {
    const itemName = item.name || "Untitled";
    const matchesSearch = itemName.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesType = true;
    if (selectedType === "Accessories") {
      matchesType = item.category === "UGC";
    } else if (selectedType === "Layered") {
      matchesType = item.category === "Layered";
    } else if (selectedType) {
      matchesType = item.type === selectedType;
    }

    return matchesSearch && matchesType;
  });

  const handleSwitchToSaved = () => {
    setShowSavedOnly((v) => !v);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AssistantPanel
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        activeGroups={activeGroups}
        catalogItems={catalogItems}
      />
      <QuickViewDrawer />
      <CartDrawer />
      <FloatingCartWidget />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center justify-between px-8 py-5">
          <span className="text-sm font-medium tracking-widest uppercase text-foreground select-none">
            clxthes
          </span>

          <div className="flex items-center gap-5">
            {/* Assistant toggle — always visible */}
            <button
              onClick={() => setAssistantOpen((v) => !v)}
              className={`text-[11px] uppercase tracking-[0.18em] transition-colors ${
                assistantOpen
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ask
            </button>

            {/* Saved toggle — only in workspace mode */}
            {!isEmptyState && (
              <button
                onClick={handleSwitchToSaved}
                className={`text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  showSavedOnly
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {showSavedOnly ? "← Feed" : "Saved"}
              </button>
            )}
          </div>
        </div>

        {hasGroups && !showSavedOnly && <GroupManager />}
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col">
        {/* ── Hero / empty state ── */}
        {isEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
            <div className="w-full max-w-sm space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-medium tracking-tight text-foreground">
                  Build your feed.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paste a Roblox community URL or ID to pull their catalog into a unified workspace.
                </p>
              </div>

              <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div className="border-b border-border focus-within:border-foreground/40 transition-colors duration-200 pb-3">
                  <input
                    type="text"
                    value={initialInput}
                    onChange={(event) => setInitialInput(event.target.value)}
                    placeholder="roblox.com/communities/..."
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!initialInput.trim()}
                  className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground disabled:text-muted-foreground/30 transition-colors"
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
                </button>
              </form>
            </div>
          </div>

        /* ── Workspace view (sidebar + grid) ── */
        ) : (
          <div className="flex flex-1 flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="flex w-full shrink-0 flex-col gap-8 border-b border-border bg-background px-8 py-8 md:w-56 md:border-b-0 md:border-r">

              {/* ── Bug fix: add-group form when no active groups ── */}
              {!hasGroups && (
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Workspace
                  </p>
                  <form onSubmit={handleSidebarGroupAdd} className="space-y-4">
                    <div className="border-b border-border focus-within:border-foreground/30 transition-colors pb-2">
                      <input
                        type="text"
                        value={sidebarGroupInput}
                        onChange={(e) => setSidebarGroupInput(e.target.value)}
                        placeholder="Add group..."
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!sidebarGroupInput.trim()}
                      className="group flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-foreground disabled:text-muted-foreground/30 transition-colors"
                    >
                      <span>Add group</span>
                      <Plus className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
                    </button>
                  </form>
                </div>
              )}

              {/* Search */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Search
                </p>
                <div className="border-b border-border focus-within:border-foreground/30 transition-colors pb-2">
                  <input
                    type="text"
                    placeholder="Filter items..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category filters */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Category
                </p>
                <nav className="flex flex-col">
                  {CLOTHING_FILTERS.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setSelectedType(value)}
                      className={`py-1.5 text-left text-sm transition-colors ${
                        selectedType === value
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  <hr className="my-2 border-border/50" />

                  {EXTENDED_FILTERS.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() =>
                        setSelectedType(selectedType === value ? null : value)
                      }
                      className={`py-1.5 text-left text-sm transition-colors ${
                        selectedType === value
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Grid area */}
            <div className="flex-1 bg-background p-6 md:p-8">
              {isLoading && !data && !showSavedOnly ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
                  {[...Array(15)].map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.4, 0.55, 0.4] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.min(index * 0.04, 0.4),
                      }}
                      className="flex flex-col"
                    >
                      <div className="aspect-square w-full bg-card" />
                      <div className="px-3 py-3 space-y-2">
                        <div className="h-2 w-12 bg-card" />
                        <div className="h-2.5 w-3/4 bg-card" />
                        <div className="h-2 w-8 bg-card" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : error ? (
                <div className="py-16 px-1">
                  <p className="text-xs text-muted-foreground border-l-2 border-[#3a1a1a] pl-4">
                    Failed to load catalog data. Try refreshing.
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {shouldShowSaved && savedItems.length === 0
                      ? "No saved items"
                      : "No items found"}
                  </span>
                  {(searchQuery || selectedType) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedType(null);
                      }}
                      className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5"
                >
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
