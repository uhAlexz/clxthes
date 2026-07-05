"use client";

import { useState } from "react";
import { Plus, X, Users, Copy } from "lucide-react";
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
      toast.error("Invalid Roblox Group URL or ID");
      return;
    }

    if (activeGroups.includes(id)) {
      toast.info("Group already added");
      setInputValue("");
      return;
    }

    addGroup(id);
    toast.success("Group added to workspace");
    setInputValue("");
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID copied");
    } catch {
      toast.error("Unable to copy ID");
    }
  };

  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-zinc-400" />
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-100">
          Active Workspace
        </h2>
      </div>

      <div className="flex w-full flex-col items-stretch gap-3 overflow-x-auto md:w-auto md:flex-row md:items-center">
        <div className="flex flex-nowrap items-center gap-2">
          {activeGroups.map((id) => (
            <div key={id} className="flex shrink-0 items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 py-1.5">
              <span className="font-mono text-xs font-medium text-zinc-100">{id}</span>
              <button
                type="button"
                onClick={() => handleCopy(id)}
                className="text-zinc-400 transition-colors hover:text-black"
                title="Copy Group ID"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => removeGroup(id)}
                className="text-zinc-400 transition-colors hover:text-red-500"
                title="Remove Group"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Paste URL or ID..."
            className="w-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-100 focus:outline-none md:w-48"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="border border-zinc-100 bg-white px-3 py-1.5 text-zinc-950 transition-colors disabled:border-zinc-800 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
