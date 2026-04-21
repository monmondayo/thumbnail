"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import TextEditOverlay from "./TextEditOverlay";
import Toolbar from "./Toolbar";
import LeftSidebar from "./LeftSidebar";
import RightPanel from "./RightPanel";
import { JAPANESE_FONTS, ensureFontsLoaded } from "@/lib/fonts";
import {
  downloadDataURL,
  loadImageSize,
  readFileAsDataURL,
  uid,
} from "@/lib/utils";
import {
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
  TextElement,
} from "@/lib/types";

const Canvas = dynamic(() => import("./Canvas"), { ssr: false });

const CANVAS_W = 1280;
const CANVAS_H = 720;

const HISTORY_MAX = 50;

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
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 14,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  shadowOpacity: 0.55,
  ...overrides,
});

export default function Editor() {
  const [state, setState] = useState<EditorState>(initialState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string>(() => uid());
  const [name, setName] = useState("無題のサムネイル");
  const [saving, setSaving] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [saved, setSaved] = useState<SavedThumbnail[]>([]);
  const [stageScale, setStageScale] = useState(1);
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

  const undo = useCallback(() => {
    setState((prev) => {
      const last = historyRef.current.pop();
      if (!last) return prev;
      futureRef.current.push(prev);
      setHistoryTick((t) => t + 1);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const next = futureRef.current.pop();
      if (!next) return prev;
      historyRef.current.push(prev);
      setHistoryTick((t) => t + 1);
      return next;
    });
  }, []);

  // Load saved list
  useEffect(() => {
    setSaved(listSaved());
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

  // Preload Japanese fonts into document.fonts so Konva can use them
  useEffect(() => {
    let mounted = true;
    ensureFontsLoaded().then(() => {
      if (mounted) setFontsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // When fonts finish loading, redraw stage so text reflects actual glyphs
  useEffect(() => {
    if (!fontsReady) return;
    stageRef.current?.batchDraw();
  }, [fontsReady]);

  // Keyboard shortcuts
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
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, undo, redo, textEdit]);

  // --- Element actions ---

  const addText = useCallback(
    (text?: string, opts?: { fontSize?: number; fill?: string }) => {
      const el = defaultText({
        ...(text ? { text } : {}),
        ...(opts?.fontSize ? { fontSize: opts.fontSize } : {}),
        ...(opts?.fill ? { fill: opts.fill } : {}),
      });
      commit((s) => ({ ...s, elements: [...s.elements, el] }));
      setSelectedId(el.id);
    },
    [commit]
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
      };
      commit((s) => ({ ...s, elements: [...s.elements, el] }));
      setSelectedId(el.id);
    },
    [commit]
  );

  const setBackground = useCallback(
    (src: string, w: number, h: number) => {
      // Fit image to cover the canvas
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
      };
      commit((s) => {
        const filtered = s.elements.filter(
          (e) => !(e.type === "image" && e.isBackground)
        );
        return { ...s, elements: [el, ...filtered] };
      });
      setSelectedId(el.id);
    },
    [commit]
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
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [commit]
  );

  const duplicateElement = useCallback(
    (id: string) => {
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
        return { ...s, elements: [...s.elements, copy] };
      });
    },
    [commit]
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

  // --- Clipboard paste ---
  // Global Cmd+V → set image as background. Works with QuickTime Player's
  // "映像をコピー", screenshots, browser "画像をコピー", etc.
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

  // Explicit "paste from clipboard" action (button-triggered). Uses the async
  // Clipboard API which requires a user gesture and may prompt for permission.
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
      setSelectedId(null);
      // Wait a frame for transformer to disappear
      requestAnimationFrame(() => {
        const mime = format === "png" ? "image/png" : "image/jpeg";
        const data = makeDataURL(mime);
        if (!data) return;
        const safeName = (name || "thumbnail").replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]+/g, "_");
        downloadDataURL(data, `${safeName}.${format}`);
      });
    },
    [makeDataURL, name]
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
    setSelectedId(null);
    await new Promise((r) => requestAnimationFrame(r));
    try {
      const preview = makePreview();
      const entry = snapshotState(state, docId, name, preview);
      saveThumbnail(entry);
      setSaved(listSaved());
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }, [state, docId, name, makePreview]);

  const load = useCallback((id: string) => {
    const item = loadSaved(id);
    if (!item) return;
    setState(item.state);
    setDocId(item.id);
    setName(item.name);
    setSelectedId(null);
    historyRef.current = [];
    futureRef.current = [];
    setHistoryTick((t) => t + 1);
  }, []);

  const removeSaved = useCallback((id: string) => {
    deleteSaved(id);
    setSaved(listSaved());
  }, []);

  const clearCanvas = useCallback(() => {
    if (!confirm("キャンバスをクリアしますか？（現在の編集内容は失われます）")) return;
    commit(() => initialState());
    setSelectedId(null);
    setDocId(uid());
    setName("無題のサムネイル");
  }, [commit]);

  // --- Auto mode ---
  const autoGenerate = useCallback(
    async (product: string, url: string, style: string) => {
      setAutoBusy(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product, url, style }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Status ${res.status}`);
        }
        const data = (await res.json()) as {
          mainText: string;
          subText?: string;
          accentText?: string;
        };

        commit((s) => {
          // Remove previously auto-generated text layers
          const rest = s.elements.filter((e) => !(e.type === "text" && (e as TextElement & { auto?: boolean }).auto));
          const main: TextElement = {
            ...defaultText({
              text: data.mainText,
              fontSize: 150,
              fontFamily: '"Dela Gothic One", sans-serif',
              fill: "#fde047",
              stroke: "#0b0b10",
              strokeWidth: 12,
              width: CANVAS_W - 160,
            }),
            x: 80,
            y: 180,
          };
          const elems: EditorElement[] = [...rest, main];
          if (data.subText) {
            elems.push({
              ...defaultText({
                text: data.subText,
                fontSize: 56,
                fontFamily: '"M PLUS Rounded 1c", sans-serif',
                fill: "#ffffff",
                stroke: "#000000",
                strokeWidth: 6,
                width: CANVAS_W - 160,
                fontStyle: "bold",
              }),
              x: 80,
              y: 520,
            });
          }
          if (data.accentText) {
            elems.push({
              ...defaultText({
                text: data.accentText,
                fontSize: 44,
                fontFamily: '"RocknRoll One", sans-serif',
                fill: "#fb7185",
                stroke: "#000000",
                strokeWidth: 4,
                width: 500,
              }),
              x: CANVAS_W - 560,
              y: 60,
            });
          }
          return { ...s, elements: elems };
        });
      } catch (err) {
        alert(`AI生成に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setAutoBusy(false);
      }
    },
    [commit]
  );

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

  const stageOffset = useMemo(() => {
    const el = canvasHolderRef.current;
    const stage = stageRef.current?.container();
    if (!el || !stage) return { left: 0, top: 0 };
    const stageRect = stage.getBoundingClientRect();
    const holderRect = el.getBoundingClientRect();
    return { left: stageRect.left - holderRect.left, top: stageRect.top - holderRect.top };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageScale, state.canvasWidth, state.canvasHeight, textEdit]);

  const editingElement = useMemo(() => {
    if (!textEdit) return null;
    const el = state.elements.find((e) => e.id === textEdit.id);
    return el && el.type === "text" ? el : null;
  }, [textEdit, state.elements]);

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
        canUndo={historyRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        saving={saving}
      />
      <div className="flex-1 min-h-0 flex">
        <LeftSidebar
          onSetBackground={setBackground}
          onPasteBackground={pasteFromClipboard}
          onAddText={addText}
          onAddImage={addImage}
          onAutoGenerate={autoGenerate}
          saved={saved}
          onLoadSaved={load}
          onDeleteSaved={removeSaved}
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
              selectedId={selectedId}
              editingId={textEdit?.id ?? null}
              onSelect={setSelectedId}
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
          onSelect={setSelectedId}
          onUpdate={updateElement}
          onDelete={deleteElement}
          onDuplicate={duplicateElement}
          onReorder={reorder}
          onToggleVisibility={toggleVisibility}
        />
      </div>

      {/* Font preload (so browser eagerly loads the webfonts for Konva) */}
      <div aria-hidden className="font-preload">
        {JAPANESE_FONTS.map((f) => (
          <span key={f.family} style={{ fontFamily: f.cssFamily }}>
            日本語テスト 123 {f.family}
          </span>
        ))}
      </div>
      {/* historyTick unused marker to keep hook deps correct */}
      <span hidden>{historyTick}</span>
    </div>
  );
}
