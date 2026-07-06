"use client";

import { useState } from "react";
import { Plus, X, Copy } from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { parseRobloxId } from "@/lib/utils";

export function GroupManager() {
  const { activeGroups, addGroup, removeGroup } = useStore();
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const id = parseRobloxId(inputValue);
    if (!id) {
      toast.error("Invalid Roblox group URL or ID");
      return;
    }

    if (activeGroups.includes(id)) {
      toast.info("Group already in workspace");
      setInputValue("");
      return;
    }

    addGroup(id);
    toast.success("Group added");
    setInputValue("");
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex flex-col items-start justify-between gap-3 border-b border-border bg-background px-8 py-3 md:flex-row md:items-center">
      <div className="flex flex-wrap items-center gap-2">
        {activeGroups.map((id) => (
          <div
            key={id}
            className="flex items-center gap-1.5 border border-border px-2.5 py-1"
          >
            <span className="font-mono text-[11px] text-muted-foreground">{id}</span>
            <button
              type="button"
              onClick={() => handleCopy(id)}
              className="text-muted-foreground/40 transition-colors hover:text-muted-foreground"
              title="Copy group ID"
            >
              <Copy className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => removeGroup(id)}
              className="text-muted-foreground/40 transition-colors hover:text-foreground"
              title="Remove group"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <div className="border-b border-border focus-within:border-foreground/30 transition-colors pb-0.5">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Add group..."
            className="w-40 bg-transparent font-mono text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none pb-0.5"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="text-muted-foreground/40 transition-colors hover:text-foreground disabled:opacity-20"
          title="Add group"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
