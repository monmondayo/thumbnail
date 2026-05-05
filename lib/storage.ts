import type { EditorState, SavedThumbnail } from "./types";

const KEY = "thumbmaker.saved.v1";

export function listSaved(): SavedThumbnail[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedThumbnail[];
    return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThumbnail(entry: SavedThumbnail) {
  if (typeof window === "undefined") return;
  const list = listSaved().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    throw new Error(
      "保存容量を超えました。古い保存データを削除するか、背景画像のサイズを小さくしてください。"
    );
  }
}

export function deleteSaved(id: string) {
  if (typeof window === "undefined") return;
  const list = listSaved().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearAllSaved() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function loadSaved(id: string): SavedThumbnail | null {
  return listSaved().find((e) => e.id === id) ?? null;
}

export function snapshotState(
  state: EditorState,
  id: string,
  name: string,
  preview: string
): SavedThumbnail {
  const now = Date.now();
  const existing = loadSaved(id);
  return {
    id,
    name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state,
    preview,
  };
}
