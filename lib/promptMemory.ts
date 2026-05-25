import { SongInput, WorldPresetKey } from "@/types";

export interface PromptMemory {
  id: string;
  ts: number;
  memo: string;
  title: string;
  songInput: SongInput;
  stylePrompt: string;
  lyrics: string;
  worldPreset: WorldPresetKey | "";
  score: number | null;
}

const KEY = "mora_memories";

export function loadMemories(): PromptMemory[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveMemory(m: PromptMemory): void {
  const list = loadMemories();
  list.unshift(m);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
}

export function deleteMemory(id: string): void {
  const list = loadMemories().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
