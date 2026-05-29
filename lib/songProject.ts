import { SongProject, SongProjectMeta } from "@/types";

const LIST_KEY = "mora-project-list";
const PROJECT_KEY = (id: string) => `mora-project-${id}`;
export const CURRENT_PROJECT_KEY = "mora-current-project";

export function generateProjectId(): string {
  return crypto.randomUUID();
}

/** Read raw (unsorted) list from localStorage. */
function readList(): SongProjectMeta[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SongProjectMeta[];
  } catch {
    return [];
  }
}

/** Return project list sorted by updatedAt descending. */
export function listProjects(): SongProjectMeta[] {
  return readList().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Compute lightweight summary fields from a SongProject for the meta index. */
function buildProjectSummary(project: SongProject): Pick<SongProjectMeta, "lyricsContentLines" | "hasStyle" | "hasNeg" | "lyricsPreview"> {
  const isSectionTag  = (line: string) => /^\[[^\]]+\]$/.test(line.trim());
  const isContentLine = (line: string) => line.trim().length > 0 && !isSectionTag(line);

  const lines        = project.lyrics ? project.lyrics.split("\n") : [];
  const contentLines = lines.filter(isContentLine);

  const firstLine = contentLines[0]?.trim() ?? "";
  const preview   = firstLine.length > 28 ? firstLine.slice(0, 28) + "…" : firstLine;

  return {
    lyricsContentLines: contentLines.length > 0 ? contentLines.length : undefined,
    hasStyle:           !!(project.stylePrompt.trim() || project.stylePromptOverride.trim()) || undefined,
    hasNeg:             !!project.negPrompt.trim() || undefined,
    lyricsPreview:      preview || undefined,
  };
}

/** Save (create or overwrite) a project and update the index. */
export function saveProject(project: SongProject): void {
  try {
    localStorage.setItem(PROJECT_KEY(project.id), JSON.stringify(project));

    const list = readList();
    const idx = list.findIndex((m) => m.id === project.id);
    const meta: SongProjectMeta = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      ...buildProjectSummary(project),
    };
    if (idx >= 0) {
      list[idx] = meta;
    } else {
      list.push(meta);
    }
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* ignore write errors */
  }
}

/** Load a single project by id. Returns null if not found or corrupt. */
export function loadProject(id: string): SongProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as SongProject;
  } catch {
    return null;
  }
}

/**
 * Validate an unknown value as a SongProject and normalise optional fields.
 * Returns null if required fields are missing or have wrong types.
 */
export function validateAndNormalizeSongProject(data: unknown): SongProject | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  if (typeof d.id !== "string" || !d.id.trim()) return null;
  if (typeof d.name !== "string") return null;
  if (typeof d.createdAt !== "string") return null;
  if (typeof d.updatedAt !== "string") return null;
  if (!d.input || typeof d.input !== "object") return null;
  if (typeof d.lyrics !== "string") return null;
  if (typeof d.stylePrompt !== "string") return null;
  if (typeof d.stylePromptOverride !== "string") return null;
  if (typeof d.negPrompt !== "string") return null;
  if (typeof d.regenPrompt !== "string") return null;
  if (d.structureMode !== "preset" && d.structureMode !== "builder") return null;
  if (!Array.isArray(d.builderSteps)) return null;
  if (!Array.isArray(d.builderSections)) return null;
  if (!Array.isArray(d.libraryIds)) return null;

  return {
    id:                  d.id,
    name:                d.name,
    createdAt:           d.createdAt,
    updatedAt:           d.updatedAt,
    input:               d.input as SongProject["input"],
    worldPreset:         typeof d.worldPreset === "string" ? d.worldPreset as SongProject["worldPreset"] : "",
    expansion:           (d.expansion != null && typeof d.expansion === "object") ? d.expansion as SongProject["expansion"] : null,
    lyrics:              d.lyrics,
    stylePrompt:         d.stylePrompt,
    stylePromptOverride: d.stylePromptOverride,
    negPrompt:           d.negPrompt,
    regenPrompt:         d.regenPrompt,
    builderSteps:        d.builderSteps as SongProject["builderSteps"],
    structureMode:       d.structureMode,
    structurePreset:     typeof d.structurePreset === "string" ? d.structurePreset as SongProject["structurePreset"] : "verse-first",
    builderSections:     d.builderSections as SongProject["builderSections"],
    libraryIds:          d.libraryIds as SongProject["libraryIds"],
    history:             Array.isArray(d.history) ? d.history as SongProject["history"] : [],
    notes:               typeof d.notes === "string" ? d.notes : "",
  };
}

/** Delete a project payload and remove it from the index. */
export function deleteProject(id: string): void {
  try {
    localStorage.removeItem(PROJECT_KEY(id));
    const list = readList();
    localStorage.setItem(LIST_KEY, JSON.stringify(list.filter((m) => m.id !== id)));
  } catch {
    /* ignore */
  }
}
