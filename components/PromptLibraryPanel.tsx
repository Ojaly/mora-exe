"use client";

import { useState, useMemo } from "react";
import {
  PROMPT_LIBRARY,
  searchPromptLibrary,
  getPromptItemById,
  PromptLibraryItem,
  PromptLibraryCategory,
} from "@/lib/promptLibrary";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  /** Items recommended by WorldForge — shown in a dedicated section above search */
  recommendedItems?: PromptLibraryItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: Array<{ value: PromptLibraryCategory | "all"; label: string }> = [
  { value: "all",        label: "ALL" },
  { value: "genre",      label: "GENRE" },
  { value: "mood",       label: "MOOD" },
  { value: "vocal",      label: "VOCAL" },
  { value: "instrument", label: "INST" },
  { value: "texture",    label: "TEXTURE" },
  { value: "structure",  label: "STRUCT" },
  { value: "metaTag",    label: "TAG" },
  { value: "production", label: "PROD" },
];

/** Item chip color per category */
const CHIP: Record<PromptLibraryCategory, string> = {
  genre:       "border-blue-200   text-blue-700   bg-blue-50",
  mood:        "border-rose-200   text-rose-700   bg-rose-50",
  vocal:       "border-violet-200 text-violet-700 bg-violet-50",
  instrument:  "border-amber-200  text-amber-700  bg-amber-50",
  texture:     "border-emerald-200 text-emerald-700 bg-emerald-50",
  structure:   "border-zinc-300   text-zinc-700   bg-zinc-100",
  metaTag:     "border-purple-200 text-purple-700 bg-purple-50",
  production:  "border-orange-200 text-orange-700 bg-orange-50",
};

/** Category label color */
const CAT_LABEL: Record<PromptLibraryCategory, string> = {
  genre:       "text-blue-600",
  mood:        "text-rose-600",
  vocal:       "text-violet-600",
  instrument:  "text-amber-600",
  texture:     "text-emerald-600",
  structure:   "text-zinc-500",
  metaTag:     "text-purple-600",
  production:  "text-orange-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromptLibraryPanel({ selectedIds, onSelectionChange, recommendedItems }: Props) {
  const [query,          setQuery]  = useState("");
  const [activeCat, setActiveCat]   = useState<PromptLibraryCategory | "all">("all");

  // Resolve selected IDs → items
  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => getPromptItemById(id))
        .filter((x): x is PromptLibraryItem => x !== undefined),
    [selectedIds]
  );

  // Build result list: category filter + optional search query
  const results = useMemo<PromptLibraryItem[]>(() => {
    const hasQuery = query.trim().length > 0;
    const hasCat   = activeCat !== "all";
    if (!hasQuery && !hasCat) return [];

    let items = hasQuery ? searchPromptLibrary(query) : PROMPT_LIBRARY;
    if (hasCat) items = items.filter((i) => i.category === activeCat);

    return items.slice(0, 60);
  }, [query, activeCat]);

  // Group results by category for grouped display
  const grouped = useMemo(() => {
    const map = new Map<PromptLibraryCategory, PromptLibraryItem[]>();
    for (const item of results) {
      const list = map.get(item.category) ?? [];
      map.set(item.category, [...list, item]);
    }
    return map;
  }, [results]);

  const toggle = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const remove = (id: string) =>
    onSelectionChange(selectedIds.filter((x) => x !== id));

  const showEmpty = results.length === 0 && (activeCat !== "all" || query.trim().length > 0);
  const showHint  = results.length === 0 && activeCat === "all" && !query.trim();

  return (
    <div className="space-y-2">

      {/* ── Recommended (from Forge) ──────────────────────────────────────── */}
      {recommendedItems && recommendedItems.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest uppercase font-semibold text-amber-600">
              ◆ Recommended
            </span>
            <span className="text-[9px] font-mono text-amber-400 leading-none">
              Forge結果から · {recommendedItems.length}件
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {recommendedItems.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  title={item.description}
                  className={`px-1.5 py-[2px] text-[11px] font-mono rounded border transition-all leading-tight ${
                    selected
                      ? "border-zinc-600 text-zinc-900 bg-zinc-200 font-semibold ring-1 ring-zinc-400"
                      : `${CHIP[item.category]} hover:ring-1 hover:ring-current`
                  }`}
                >
                  {selected && <span className="mr-0.5 opacity-70">✓</span>}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────────────── */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="swing / husky / drop …"
        className="w-full h-8 border border-[#d0d7de] rounded px-2.5 text-[12px] font-mono text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
        style={{ background: "#fafbfc" }}
      />

      {/* ── Category filter ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1">
        {CATEGORY_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCat(value)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
              activeCat === value
                ? "border-zinc-500 text-zinc-900 bg-zinc-200 font-bold"
                : "border-[#d0d7de] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Results (grouped by category) ─────────────────────────────────── */}
      {results.length > 0 && (
        <div className="space-y-2.5 pr-0.5">
          {[...grouped.entries()].map(([cat, items]) => (
            <div key={cat}>
              <span className={`text-[9px] font-mono tracking-widest uppercase font-semibold block mb-1 ${CAT_LABEL[cat]}`}>
                {cat}
              </span>
              <div className="flex flex-wrap gap-1">
                {items.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      title={item.description}
                      className={`px-1.5 py-[2px] text-[11px] font-mono rounded border transition-all leading-tight ${
                        selected
                          ? "border-zinc-600 text-zinc-900 bg-zinc-200 font-semibold ring-1 ring-zinc-400"
                          : `${CHIP[cat]} hover:ring-1 hover:ring-current`
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {showEmpty && (
        <p className="text-[10px] font-mono text-zinc-400 text-center py-1.5">
          no results
        </p>
      )}

      {/* ── Hint (no input at all) ─────────────────────────────────────────── */}
      {showHint && (
        <p className="text-[10px] font-mono text-zinc-400 leading-snug">
          検索またはカテゴリを選択
        </p>
      )}

      {/* ── Selected ─────────────────────────────────────────────────────── */}
      {selectedItems.length > 0 && (
        <div className="border-t border-[#d0d7de] pt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase font-semibold">
              selected ({selectedItems.length})
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              ✕ clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-0.5 px-1.5 py-[2px] text-[11px] font-mono rounded border leading-tight ${CHIP[item.category]}`}
              >
                {item.label}
                <button
                  onClick={() => remove(item.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity ml-0.5 text-[10px] leading-none"
                  title="remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
