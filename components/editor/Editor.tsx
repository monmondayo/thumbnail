"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import TextEditOverlay from "./TextEditOverlay";
import Toolbar from "./Toolbar";
import LeftSidebar, { type AutoResult } from "./LeftSidebar";
import RightPanel from "./RightPanel";
import { JAPANESE_FONTS, ensureFontsLoaded } from "@/lib/fonts";
import {
  downloadDataURL,
  loadImageSize,
  readFileAsDataURL,
  uid,
} from "@/lib/utils";
import {
  clearAllSaved,
  deleteSaved,
  listSaved,
  loadSaved,
  saveThumbnail,
  snapshotState,
} from "@/lib/storage";
import type {
  EditorElement,
  EditorState,
  ImageElement,
  SavedThumbnail,
  ShapeElement,
  ShapeKind,
  TextElement,
} from "@/lib/types";
import { findTemplate } from "@/lib/templates";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

const CANVAS_W = 1280;
const CANVAS_H = 720;

const HISTORY_MAX = 50;
const LOCAL_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const SAVE_TARGET_BYTES = Math.floor(LOCAL_STORAGE_LIMIT_BYTES * 0.96);

const COMPRESSION_PRESETS: Array<{ maxDimension: number; quality: number }> = [
  { maxDimension: 2048, quality: 0.82 },
  { maxDimension: 1600, quality: 0.74 },
  { maxDimension: 1280, quality: 0.66 },
  { maxDimension: 1024, quality: 0.58 },
  { maxDimension: 900, quality: 0.5 },
];

function estimateUtf16Bytes(value: string) {
  return value.length * 2;
}

function estimateSavedBytesWithEntry(entry: SavedThumbnail) {
  const list = listSaved().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  return estimateUtf16Bytes(JSON.stringify(list));
}

function isImageDataUrl(src: string) {
  return src.startsWith("data:image/");
}

function computeScaledSize(width: number, height: number, maxDimension: number) {
  const largest = Math.max(width, height);
  if (largest <= maxDimension) return { width, height };
  const ratio = maxDimension / largest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressDataUrlToJpeg(
  src: string,
  preset: { maxDimension: number; quality: number }
) {
  try {
    const img = await loadImage(src);
    const size = computeScaledSize(img.width, img.height, preset.maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, size.width, size.height);
    return canvas.toDataURL("image/jpeg", preset.quality);
  } catch {
    return src;
  }
}

async function compressStateImagesOnce(
  state: EditorState,
  preset: { maxDimension: number; quality: number }
): Promise<{ state: EditorState; changed: boolean }> {
  let changed = false;
  const nextElements = await Promise.all(
    state.elements.map(async (el): Promise<EditorElement> => {
      if (el.type !== "image" || !isImageDataUrl(el.src)) return el;
      const nextSrc = await compressDataUrlToJpeg(el.src, preset);
      if (nextSrc.length >= el.src.length) return el;
      changed = true;
      return { ...el, src: nextSrc };
    })
  );
  if (!changed) return { state, changed: false };
  return { state: { ...state, elements: nextElements }, changed: true };
}

const initialState = (): EditorState => ({
  elements: [],
  canvasWidth: CANVAS_W,
  canvasHeight: CANVAS_H,
  backgroundColor: "#18181b",
});

const defaultText = (overrides: Partial<TextElement> = {}): TextElement => ({
  id: uid(),
  type: "text",
  text: overrides.text ?? "テキストを入力",
  x: (CANVAS_W - (overrides.width ?? 600)) / 2,
  y: (CANVAS_H - (overrides.fontSize ?? 96)) / 2,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  visible: true,
  fontFamily: '"Noto Sans JP", sans-serif',
  fontSize: 96,
  fontStyle: "bold",
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 6,
  align: "center",
  width: 600,
  lineHeight: 1.15,
  letterSpacing: 0,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 14,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  shadowOpacity: 0.55,
  opacity: 1,
  ...overrides,
});

const defaultShape = (overrides: Partial<ShapeElement> = {}): ShapeElement => ({
  id: uid(),
  type: "shape",
  shape: "rect",
  x: (CANVAS_W - (overrides.width ?? 400)) / 2,
  y: (CANVAS_H - (overrides.height ?? 200)) / 2,
  width: 400,
  height: 200,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  visible: true,
  fill: "#fde047",
  stroke: "transparent",
  strokeWidth: 0,
  cornerRadius: 24,
  opacity: 1,
  shadowEnabled: false,
  shadowColor: "#000000",
  shadowBlur: 20,
  shadowOffsetX: 0,
  shadowOffsetY: 6,
  shadowOpacity: 0.3,
  ...overrides,
});

function estimateFitFontSize({
  text,
  width,
  max,
  min,
  lineHeight = 1.1,
}: {
  text: string;
  width: number;
  max: number;
  min: number;
  lineHeight?: number;
}) {
  const lines = text.split("\n").filter(Boolean);
  const longest = Math.max(...lines.map((line) => line.trim().length), 1);
  const lineCount = Math.max(lines.length, 1);
  const widthBased = Math.floor(width / Math.max(longest * 0.92, 1));
  const heightBudget = lineCount >= 4 ? 0.72 : lineCount === 3 ? 0.84 : lineCount === 2 ? 1 : 1.08;
  const heightBased = Math.floor((CANVAS_H * heightBudget) / Math.max(lineCount * lineHeight, 1));
  return Math.max(min, Math.min(max, widthBased, heightBased));
}

export default function Editor() {
  const [state, setState] = useState<EditorState>(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [docId, setDocId] = useState<string>(() => uid());
  const [name, setName] = useState("無題のサムネイル");
  const [saving, setSaving] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [saved, setSaved] = useState<SavedThumbnail[]>(() => listSaved());
  const [stageScale, setStageScale] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [textEdit, setTextEdit] = useState<
    | {
        id: string;
        rect: { x: number; y: number; width: number; height: number; rotation: number };
      }
    | null
  >(null);
  const [fontsReady, setFontsReady] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);

  // History (undo / redo)
  const historyRef = useRef<EditorState[]>([]);
  const futureRef = useRef<EditorState[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const pushHistory = useCallback((prev: EditorState) => {
    historyRef.current.push(prev);
    if (historyRef.current.length > HISTORY_MAX) historyRef.current.shift();
    futureRef.current = [];
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(false);
    setHistoryTick((t) => t + 1);
  }, []);

  const commit = useCallback(
    (updater: (s: EditorState) => EditorState) => {
      setState((prev) => {
        const next = updater(prev);
        if (next !== prev) pushHistory(prev);
        return next;
      });
    },
    [pushHistory]
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedIds([]);
  }, []);

  const selectSingle = useCallback((id: string | null) => {
    if (!id) {
      clearSelection();
      return;
    }
    setSelectedId(id);
    setSelectedIds([id]);
  }, [clearSelection]);

  const selectFromCanvas = useCallback(
    (id: string | null, opts?: { additive?: boolean }) => {
      if (!id) {
        clearSelection();
        return;
      }
      if (!opts?.additive) {
        selectSingle(id);
        return;
      }
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          const next = prev.filter((v) => v !== id);
          setSelectedId(next[next.length - 1] ?? null);
          return next;
        }
        const next = [...prev, id];
        setSelectedId(id);
        return next;
      });
    },
    [clearSelection, selectSingle]
  );

  const undo = useCallback(() => {
    setState((prev) => {
      const last = historyRef.current.pop();
      if (!last) return prev;
      futureRef.current.push(prev);
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(futureRef.current.length > 0);
      setHistoryTick((t) => t + 1);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = futureRef.current.pop();
      if (!next) return prev;
      historyRef.current.push(prev);
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(futureRef.current.length > 0);
      setHistoryTick((t) => t + 1);
      return next;
    });
  }, []);

  // Fit canvas to container
  useEffect(() => {
    const el = canvasHolderRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const s = Math.min((width - 32) / CANVAS_W, (height - 32) / CANVAS_H, 1);
      setStageScale(Math.max(0.1, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Preload Japanese fonts
  useEffect(() => {
    let mounted = true;
    ensureFontsLoaded().then(() => {
      if (mounted) setFontsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!fontsReady) return;
    stageRef.current?.batchDraw();
  }, [fontsReady]);

  // --- Element actions ---

  const addText = useCallback(
    (text?: string, opts?: { fontSize?: number; fill?: string }) => {
      const el = defaultText({
        ...(text ? { text } : {}),
        ...(opts?.fontSize ? { fontSize: opts.fontSize } : {}),
        ...(opts?.fill ? { fill: opts.fill } : {}),
      });
      commit((s) => ({ ...s, elements: [...s.elements, el] }));
      selectSingle(el.id);
    },
    [commit, selectSingle]
  );

  const addImage = useCallback(
    (src: string, w: number, h: number) => {
      const maxDim = 500;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const width = w * scale;
      const height = h * scale;
      const el: ImageElement = {
        id: uid(),
        type: "image",
        src,
        width,
        height,
        x: (CANVAS_W - width) / 2,
        y: (CANVAS_H - height) / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        opacity: 1,
      };
      commit((s) => ({ ...s, elements: [...s.elements, el] }));
      selectSingle(el.id);
    },
    [commit, selectSingle]
  );

  const addShape = useCallback(
    (
      shape: ShapeKind,
      opts?: Partial<{ fill: string; cornerRadius: number; width: number; height: number }>
    ) => {
      const el = defaultShape({
        shape,
        ...(opts?.fill ? { fill: opts.fill } : {}),
        ...(opts?.cornerRadius !== undefined ? { cornerRadius: opts.cornerRadius } : {}),
        ...(opts?.width ? { width: opts.width } : {}),
        ...(opts?.height ? { height: opts.height } : {}),
      });
      // Re-center based on provided dimensions
      el.x = (CANVAS_W - el.width) / 2;
      el.y = (CANVAS_H - el.height) / 2;
      commit((s) => ({ ...s, elements: [...s.elements, el] }));
      selectSingle(el.id);
    },
    [commit, selectSingle]
  );

  const setBackground = useCallback(
    (src: string, w: number, h: number) => {
      const scale = Math.max(CANVAS_W / w, CANVAS_H / h);
      const width = w * scale;
      const height = h * scale;
      const el: ImageElement = {
        id: uid(),
        type: "image",
        src,
        width,
        height,
        x: (CANVAS_W - width) / 2,
        y: (CANVAS_H - height) / 2,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        visible: true,
        isBackground: true,
        opacity: 1,
      };
      commit((s) => {
        const filtered = s.elements.filter(
          (e) => !(e.type === "image" && e.isBackground)
        );
        return { ...s, elements: [el, ...filtered] };
      });
      selectSingle(el.id);
    },
    [commit, selectSingle]
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<EditorElement>) => {
      commit((s) => ({
        ...s,
        elements: s.elements.map((e) =>
          e.id === id ? ({ ...e, ...patch } as EditorElement) : e
        ),
      }));
    },
    [commit]
  );

  const deleteElement = useCallback(
    (id: string) => {
      commit((s) => ({ ...s, elements: s.elements.filter((e) => e.id !== id) }));
      setSelectedIds((cur) => cur.filter((v) => v !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit]
  );

  const deleteSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    commit((s) => ({ ...s, elements: s.elements.filter((e) => !ids.has(e.id)) }));
    clearSelection();
  }, [selectedIds, commit, clearSelection]);

  const duplicateElement = useCallback(
    (id: string) => {
      let newId: string | null = null;
      commit((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (!el) return s;
        const copy: EditorElement = {
          ...el,
          id: uid(),
          x: el.x + 30,
          y: el.y + 30,
          ...(el.type === "image" ? { isBackground: false } : {}),
        };
        newId = copy.id;
        return { ...s, elements: [...s.elements, copy] };
      });
      if (newId) selectSingle(newId);
    },
    [commit, selectSingle]
  );

  const duplicateSelection = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selected = new Set(selectedIds);
    const newIds: string[] = [];
    commit((s) => {
      const copies: EditorElement[] = [];
      for (const el of s.elements) {
        if (!selected.has(el.id)) continue;
        const copy: EditorElement = {
          ...el,
          id: uid(),
          x: el.x + 30,
          y: el.y + 30,
          ...(el.type === "image" ? { isBackground: false } : {}),
        };
        copies.push(copy);
        newIds.push(copy.id);
      }
      return { ...s, elements: [...s.elements, ...copies] };
    });
    if (newIds.length > 0) {
      setSelectedIds(newIds);
      setSelectedId(newIds[newIds.length - 1]);
    }
  }, [selectedIds, commit]);

  const setTextAlignForSelection = useCallback(
    (align: TextElement["align"]) => {
      if (selectedIds.length === 0) return;
      const ids = new Set(selectedIds);
      commit((s) => ({
        ...s,
        elements: s.elements.map((e) => {
          if (!ids.has(e.id) || e.type !== "text") return e;
          return { ...e, align };
        }),
      }));
    },
    [selectedIds, commit]
  );

  const alignObjects = useCallback(
    (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedIds.length === 0) return;
      const ids = new Set(selectedIds);
      commit((s) => ({
        ...s,
        elements: s.elements.map((e) => {
          if (!ids.has(e.id)) return e;
          const w = e.type === "text" ? e.width * e.scaleX : e.width * e.scaleX;
          const h = e.type === "text"
            ? e.fontSize * e.lineHeight * Math.max(1, e.text.split("\n").length) * e.scaleY
            : e.height * e.scaleY;
          let x = e.x;
          let y = e.y;
          if (mode === "left") x = 0;
          if (mode === "center") x = (CANVAS_W - w) / 2;
          if (mode === "right") x = CANVAS_W - w;
          if (mode === "top") y = 0;
          if (mode === "middle") y = (CANVAS_H - h) / 2;
          if (mode === "bottom") y = CANVAS_H - h;
          return { ...e, x, y } as EditorElement;
        }),
      }));
    },
    [selectedIds, commit]
  );

  const reorder = useCallback(
    (id: string, direction: "up" | "down" | "top" | "bottom") => {
      commit((s) => {
        const idx = s.elements.findIndex((e) => e.id === id);
        if (idx < 0) return s;
        const arr = [...s.elements];
        const [el] = arr.splice(idx, 1);
        let newIdx = idx;
        if (direction === "up") newIdx = Math.min(arr.length, idx + 1);
        if (direction === "down") newIdx = Math.max(0, idx - 1);
        if (direction === "top") newIdx = arr.length;
        if (direction === "bottom") newIdx = 0;
        arr.splice(newIdx, 0, el);
        return { ...s, elements: arr };
      });
    },
    [commit]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      commit((s) => ({
        ...s,
        elements: s.elements.map((e) =>
          e.id === id ? ({ ...e, visible: !e.visible } as EditorElement) : e
        ),
      }));
    },
    [commit]
  );

  const setCanvasBg = useCallback(
    (c: string) => commit((s) => ({ ...s, backgroundColor: c })),
    [commit]
  );

  // --- Template application ---
  const applyTemplate = useCallback(
    (templateId: string, phrases?: string[]) => {
      const tpl = findTemplate(templateId);
      if (!tpl) return;
      const newEls = tpl.build({
        canvasWidth: CANVAS_W,
        canvasHeight: CANVAS_H,
        uid,
        phrases,
      });
      commit((s) => {
        // Keep only background image; replace all other elements
        const bg = s.elements.filter((e) => e.type === "image" && e.isBackground);
        return { ...s, elements: [...bg, ...newEls] };
      });
      clearSelection();
    },
    [commit, clearSelection]
  );

  // --- Auto mode ---
  const autoGenerate = useCallback(
    async (opts: {
      product: string;
      url: string;
      style: string;
      mode: "research" | "simple";
    }): Promise<AutoResult | null> => {
      setAutoBusy(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(opts),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Status ${res.status}`);
        }
        return (await res.json()) as AutoResult;
      } catch (err) {
        alert(`AI生成に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      } finally {
        setAutoBusy(false);
      }
    },
    []
  );

  const applyAutoResult = useCallback(
    (res: AutoResult, templateId?: string) => {
      const headline = res.headline ?? res.mainText ?? "";
      const sub = res.subHeadline ?? res.subText ?? "";
      const features = res.features ?? [];
      const stats = res.stats ?? [];
      const verdicts = res.verdicts ?? [];
      const accent = res.accent ?? res.accentText ?? "";

      if (templateId) {
        // Feed the phrase list into the template in a sensible order
        const phrases = [
          headline,
          sub,
          ...features,
          ...stats,
          ...verdicts,
          accent,
        ].filter((p) => p && p.trim());
        applyTemplate(templateId, phrases);
        return;
      }

      // No template: lay them out freeform in distinct zones
      commit((s) => {
        // Drop existing non-background elements
        const bg = s.elements.filter((e) => e.type === "image" && e.isBackground);
        const elems: EditorElement[] = [...bg];
        const headlineFontSize = headline
          ? estimateFitFontSize({ text: headline, width: CANVAS_W - 160, max: 136, min: 68, lineHeight: 1.02 })
          : 0;
        const subFontSize = sub
          ? estimateFitFontSize({ text: sub, width: CANVAS_W - 160, max: 54, min: 30, lineHeight: 1.12 })
          : 0;

        if (headline) {
          elems.push(
            defaultText({
              text: headline,
              fontSize: headlineFontSize,
              fontFamily: '"Noto Sans JP", sans-serif',
              fontStyle: "bold",
              fill: "#fde047",
              stroke: "#0b0b10",
              strokeWidth: Math.max(6, Math.round(headlineFontSize * 0.08)),
              width: CANVAS_W - 160,
              x: 80,
              y: 96,
              align: "left",
              lineHeight: 1.02,
            })
          );
        }
        if (sub) {
          elems.push(
            defaultText({
              text: sub,
              fontSize: subFontSize,
              fontFamily: '"Noto Sans JP", sans-serif',
              fill: "#ffffff",
              stroke: "#000000",
              strokeWidth: Math.max(2, Math.round(subFontSize * 0.08)),
              width: CANVAS_W - 160,
              x: 80,
              y: 110 + headlineFontSize * Math.max(1, headline.split("\n").length) * 1.04,
              align: "left",
              fontStyle: "bold",
              lineHeight: 1.12,
            })
          );
        }

        // Feature pills in the lower band
        const featureColors = ["#fde047", "#fb923c", "#22c55e", "#60a5fa", "#ec4899", "#a78bfa"];
        features.slice(0, 4).forEach((f, i) => {
          const pillW = 300;
          const pillH = 80;
          const x = 80 + (i % 2) * (pillW + 30);
          const y = 440 + Math.floor(i / 2) * (pillH + 20);
          elems.push({
            id: uid(),
            type: "shape",
            shape: "rect",
            x,
            y,
            width: pillW,
            height: pillH,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            visible: true,
            fill: featureColors[i % featureColors.length],
            stroke: "transparent",
            strokeWidth: 0,
            cornerRadius: 100,
            opacity: 1,
            shadowEnabled: true,
            shadowColor: "#000000",
            shadowBlur: 18,
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            shadowOpacity: 0.45,
          } satisfies ShapeElement);
          elems.push(
            defaultText({
              text: f,
              fontSize: estimateFitFontSize({ text: f, width: pillW - 24, max: 38, min: 18, lineHeight: 1.05 }),
              fontFamily: '"Noto Sans JP", sans-serif',
              fontStyle: "bold",
              fill: "#0f0f10",
              stroke: "transparent",
              strokeWidth: 0,
              width: pillW,
              x,
              y: y + 16,
              align: "center",
              shadowEnabled: false,
            })
          );
        });

        // Stats — top-right corner stacked
        stats.slice(0, 2).forEach((st, i) => {
          elems.push(
            defaultText({
              text: st,
              fontSize: estimateFitFontSize({ text: st, width: 520, max: 44, min: 22, lineHeight: 1.05 }),
              fontFamily: '"Noto Sans JP", sans-serif',
              fontStyle: "bold",
              fill: "#fff",
              stroke: "#dc2626",
              strokeWidth: 4,
              width: 520,
              x: CANVAS_W - 540,
              y: 40 + i * 80,
              align: "right",
            })
          );
        });

        // Verdict — bottom-right sticker
        if (verdicts[0]) {
          elems.push({
            id: uid(),
            type: "shape",
            shape: "ellipse",
            x: CANVAS_W - 260,
            y: CANVAS_H - 260,
            width: 220,
            height: 220,
            rotation: -8,
            scaleX: 1,
            scaleY: 1,
            visible: true,
            fill: "#dc2626",
            stroke: "transparent",
            strokeWidth: 0,
            cornerRadius: 0,
            opacity: 1,
            shadowEnabled: true,
            shadowColor: "#000000",
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowOffsetY: 6,
            shadowOpacity: 0.5,
          } satisfies ShapeElement);
          elems.push(
            defaultText({
              text: verdicts[0],
              fontSize: estimateFitFontSize({ text: verdicts[0], width: 180, max: 34, min: 18, lineHeight: 1.05 }),
              fontFamily: '"Noto Sans JP", sans-serif',
              fontStyle: "bold",
              fill: "#ffffff",
              stroke: "transparent",
              strokeWidth: 0,
              width: 220,
              x: CANVAS_W - 260,
              y: CANVAS_H - 180,
              rotation: -8,
              align: "center",
              shadowEnabled: false,
            })
          );
        }

        // Accent — top-left corner
        if (accent) {
          elems.push({
            id: uid(),
            type: "shape",
            shape: "rect",
            x: -10,
            y: 30,
            width: 260,
            height: 70,
            rotation: -4,
            scaleX: 1,
            scaleY: 1,
            visible: true,
            fill: "#0f172a",
            stroke: "#fde047",
            strokeWidth: 4,
            cornerRadius: 0,
            opacity: 1,
            shadowEnabled: false,
            shadowColor: "#000",
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowOpacity: 0,
          } satisfies ShapeElement);
          elems.push(
            defaultText({
              text: accent,
              fontSize: estimateFitFontSize({ text: accent, width: 220, max: 28, min: 16, lineHeight: 1.05 }),
              fontFamily: '"Noto Sans JP", sans-serif',
              fontStyle: "bold",
              fill: "#fde047",
              stroke: "transparent",
              strokeWidth: 0,
              width: 260,
              x: -10,
              y: 42,
              rotation: -4,
              align: "center",
              shadowEnabled: false,
            })
          );
        }

        return { ...s, elements: elems };
      });
      clearSelection();
    },
    [commit, applyTemplate, clearSelection]
  );

  // --- Clipboard paste → background ---
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (textEdit) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          try {
            const src = await readFileAsDataURL(file);
            const { width, height } = await loadImageSize(src);
            setBackground(src, width, height);
          } catch (err) {
            console.error("Paste failed:", err);
            alert("クリップボードの画像を読み込めませんでした");
          }
          return;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [setBackground, textEdit]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.read) {
        alert("このブラウザはクリップボードAPIに対応していません。⌘V で直接貼り付けてください。");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (!imgType) continue;
        const blob = await item.getType(imgType);
        const src = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        const { width, height } = await loadImageSize(src);
        setBackground(src, width, height);
        return;
      }
      alert("クリップボードに画像がありません。");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`クリップボードの読み取りに失敗しました: ${msg}\n⌘V で直接貼り付けてみてください。`);
    }
  }, [setBackground]);

  const pasteImageLayerFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.read) {
        alert("このブラウザはクリップボードAPIに対応していません。⌘V で直接貼り付けてください。");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (!imgType) continue;
        const blob = await item.getType(imgType);
        const src = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        const { width, height } = await loadImageSize(src);
        addImage(src, width, height);
        return;
      }
      alert("クリップボードに画像がありません。");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`クリップボードの読み取りに失敗しました: ${msg}\n⌘V で直接貼り付けてみてください。`);
    }
  }, [addImage]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (textEdit) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d" && selectedIds.length > 0) {
        e.preventDefault();
        duplicateSelection();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelection();
      } else if (e.key === "Escape") {
        clearSelection();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds.length, undo, redo, textEdit, duplicateSelection, deleteSelection, clearSelection]);

  // --- Export / Save ---

  const makeDataURL = useCallback(
    (mimeType: "image/png" | "image/jpeg"): string | null => {
      const stage = stageRef.current;
      if (!stage) return null;
      const ratio = 1 / stageScale;
      return stage.toDataURL({
        mimeType,
        quality: mimeType === "image/jpeg" ? 0.92 : undefined,
        pixelRatio: ratio,
      });
    },
    [stageScale]
  );

  const exportImage = useCallback(
    (format: "png" | "jpeg") => {
      clearSelection();
      requestAnimationFrame(() => {
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const data = makeDataURL(mime);
        if (!data) return;
        const safeName = (name || "thumbnail").replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]+/g, "_");
        downloadDataURL(data, `${safeName}.${format}`);
      });
    },
    [makeDataURL, name, clearSelection]
  );

  const makePreview = useCallback((): string => {
    const stage = stageRef.current;
    if (!stage) return "";
    const previewScale = 320 / CANVAS_W / stageScale;
    return stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.7,
      pixelRatio: previewScale,
    });
  }, [stageScale]);

  const save = useCallback(async () => {
    setSaving(true);
    clearSelection();
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const preview = makePreview();
      let workState = state;
      let entry = snapshotState(workState, docId, name, preview);
      let estimatedBytes = estimateSavedBytesWithEntry(entry);

      if (estimatedBytes > SAVE_TARGET_BYTES) {
        for (const preset of COMPRESSION_PRESETS) {
          const compressed = await compressStateImagesOnce(workState, preset);
          if (!compressed.changed) continue;
          workState = compressed.state;
          entry = snapshotState(workState, docId, name, preview);
          estimatedBytes = estimateSavedBytesWithEntry(entry);
          if (estimatedBytes <= SAVE_TARGET_BYTES) break;
        }
      }

      if (estimatedBytes > LOCAL_STORAGE_LIMIT_BYTES) {
        throw new Error(
          "画像データが大きすぎるため保存できませんでした。保存済みデータを削除するか、画像サイズを小さくしてください。"
        );
      }

      saveThumbnail(entry);
      setSaved(listSaved());
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [state, docId, name, makePreview, clearSelection]);

  const load = useCallback((id: string) => {
    const item = loadSaved(id);
    if (!item) return;
    setState(item.state);
    setDocId(item.id);
    setName(item.name);
    clearSelection();
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setHistoryTick((t) => t + 1);
  }, [clearSelection]);

  const removeSaved = useCallback((id: string) => {
    deleteSaved(id);
    setSaved(listSaved());
  }, []);

  const clearAllSavedCb = useCallback(() => {
    if (!confirm("保存済みデータをすべて削除しますか？この操作は元に戻せません。")) return;
    clearAllSaved();
    setSaved([]);
  }, []);

  const clearCanvas = useCallback(() => {
    if (!confirm("キャンバスをクリアしますか？（現在の編集内容は失われます）")) return;
    commit(() => initialState());
    clearSelection();
    setDocId(uid());
    setName("無題のサムネイル");
    historyRef.current = [];
    futureRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [commit, clearSelection]);

  // --- Inline text editing ---
  const startTextEdit = useCallback(
    (id: string, rect: { x: number; y: number; width: number; height: number; rotation: number }) => {
      setTextEdit({ id, rect });
    },
    []
  );

  const commitTextEdit = useCallback(
    (newText: string) => {
      if (!textEdit) return;
      updateElement(textEdit.id, { text: newText });
      setTextEdit(null);
    },
    [textEdit, updateElement]
  );

  const editingElement = useMemo(() => {
    if (!textEdit) return null;
    const el = state.elements.find((e) => e.id === textEdit.id);
    return el && el.type === "text" ? el : null;
  }, [textEdit, state.elements]);

  const handleLayerSelect = useCallback(
    (id: string | null, evt?: { additive?: boolean }) => {
      selectFromCanvas(id, evt);
    },
    [selectFromCanvas]
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Toolbar
        name={name}
        onNameChange={setName}
        onSave={save}
        onOpenSaved={() => {}}
        onExport={exportImage}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        saving={saving}
      />
      <div className="flex-1 min-h-0 flex">
        <LeftSidebar
          onSetBackground={setBackground}
          onPasteBackground={pasteFromClipboard}
          onPasteImageLayer={pasteImageLayerFromClipboard}
          onAddText={addText}
          onAddImage={addImage}
          onAddShape={addShape}
          onApplyTemplate={applyTemplate}
          onAutoGenerate={autoGenerate}
          onApplyAutoResult={applyAutoResult}
          saved={saved}
          onLoadSaved={load}
          onDeleteSaved={removeSaved}
                    onClearAllSaved={clearAllSavedCb}
          canvasBg={state.backgroundColor}
          onCanvasBgChange={setCanvasBg}
          autoBusy={autoBusy}
        />
        <div
          ref={canvasHolderRef}
          className="flex-1 min-w-0 relative flex items-center justify-center bg-zinc-950 overflow-hidden"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#18181b 0% 25%, #09090b 0% 50%)",
            backgroundSize: "24px 24px",
          }}
        >
          <div
            className="relative shadow-2xl shadow-black/50 ring-1 ring-zinc-800"
            style={{
              width: state.canvasWidth * stageScale,
              height: state.canvasHeight * stageScale,
            }}
          >
            <Canvas
              state={state}
              selectedIds={selectedIds}
              editingId={textEdit?.id ?? null}
              onSelect={selectFromCanvas}
              onChange={(el) => updateElement(el.id, el)}
              onEditText={startTextEdit}
              stageRef={stageRef}
              stageScale={stageScale}
            />
            {textEdit && editingElement && (
              <TextEditOverlay
                element={editingElement}
                rect={textEdit.rect}
                stageScale={stageScale}
                stageOffset={{ left: 0, top: 0 }}
                onCommit={commitTextEdit}
                onCancel={() => setTextEdit(null)}
              />
            )}
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] text-zinc-500 font-mono bg-zinc-900/80 px-2 py-1 rounded">
            {CANVAS_W}×{CANVAS_H} · {Math.round(stageScale * 100)}%
          </div>
          {!fontsReady && (
            <div className="absolute top-3 right-3 text-[10px] text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded">
              日本語フォント読み込み中...
            </div>
          )}
        </div>
        <RightPanel
          elements={state.elements}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={handleLayerSelect}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onDuplicate={duplicateElement}
          onDeleteSelection={deleteSelection}
          onDuplicateSelection={duplicateSelection}
          onTextAlignSelection={setTextAlignForSelection}
          onAlignObjects={alignObjects}
          onReorder={reorder}
          onToggleVisibility={toggleVisibility}
        />
      </div>

      {/* Font preload */}
      <div aria-hidden className="font-preload">
        {JAPANESE_FONTS.map((f) => (
          <span key={f.family} style={{ fontFamily: f.cssFamily }}>
            日本語テスト 123 {f.family}
          </span>
        ))}
      </div>
      <span hidden>{historyTick}</span>
    </div>
  );
}
