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
