"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  Type,
  Sparkles,
  Upload,
  FolderOpen,
  Palette,
  Clipboard,
  Shapes,
  LayoutTemplate,
  Square,
  Circle,
  Loader2,
} from "lucide-react";
import { cn, readFileAsDataURL, loadImageSize } from "@/lib/utils";
import type { EditorElement, SavedThumbnail, ShapeKind, TextElement } from "@/lib/types";
import {
  TEMPLATES,
  LAYOUT_META,
  DEFAULT_TEMPLATES_PER_LAYOUT,
  type TemplateDef,
} from "@/lib/templates";

type Tab = "upload" | "text" | "image" | "shape" | "template" | "auto" | "saved";

export type AutoResult = {
  mode: "research" | "simple";
  headline?: string;
  subHeadline?: string;
  mainText?: string;
  subText?: string;
  features?: string[];
  stats?: string[];
  verdicts?: string[];
  accent?: string;
  accentText?: string;
  category?: string;
};

type Props = {
  onSetBackground: (src: string, width: number, height: number) => void;
  onPasteBackground: () => Promise<void> | void;
  onAddText: (text?: string, opts?: { fontSize?: number; fill?: string }) => void;
  onAddImage: (src: string, width: number, height: number) => void;
  onAddShape: (shape: ShapeKind, opts?: Partial<{ fill: string; cornerRadius: number; width: number; height: number }>) => void;
  onApplyTemplate: (templateId: string, phrases?: string[]) => void;
  onAutoGenerate: (opts: {
    product: string;
    url: string;
    style: string;
    mode: "research" | "simple";
  }) => Promise<AutoResult | null>;
  onApplyAutoResult: (res: AutoResult, templateId?: string) => void;
  saved: SavedThumbnail[];
  onLoadSaved: (id: string) => void;
  onDeleteSaved: (id: string) => void;
  canvasBg: string;
  onCanvasBgChange: (c: string) => void;
  autoBusy?: boolean;
};

export default function LeftSidebar(props: Props) {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="w-[340px] shrink-0 border-r border-zinc-800 bg-zinc-900 flex">
      <div className="flex flex-col w-16 border-r border-zinc-800 bg-zinc-950/50">
        <TabBtn active={tab === "upload"} onClick={() => setTab("upload")} icon={<Upload className="w-5 h-5" />} label="背景" />
        <TabBtn active={tab === "text"} onClick={() => setTab("text")} icon={<Type className="w-5 h-5" />} label="テキスト" />
        <TabBtn active={tab === "image"} onClick={() => setTab("image")} icon={<ImageIcon className="w-5 h-5" />} label="画像" />
        <TabBtn active={tab === "shape"} onClick={() => setTab("shape")} icon={<Shapes className="w-5 h-5" />} label="図形" />
        <TabBtn active={tab === "template"} onClick={() => setTab("template")} icon={<LayoutTemplate className="w-5 h-5" />} label="テンプレ" />
        <TabBtn active={tab === "auto"} onClick={() => setTab("auto")} icon={<Sparkles className="w-5 h-5" />} label="AI" />
        <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<FolderOpen className="w-5 h-5" />} label="保存" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "upload" && (
          <UploadPanel
            onSet={props.onSetBackground}
            onPaste={props.onPasteBackground}
            bg={props.canvasBg}
            onBgChange={props.onCanvasBgChange}
          />
        )}
        {tab === "text" && <TextPanel onAdd={props.onAddText} />}
        {tab === "image" && <ImagePanel onAdd={props.onAddImage} />}
        {tab === "shape" && <ShapePanel onAdd={props.onAddShape} />}
        {tab === "template" && <TemplatePanel onApply={props.onApplyTemplate} />}
        {tab === "auto" && (
          <AutoPanel
            onGenerate={props.onAutoGenerate}
            onApply={props.onApplyAutoResult}
            busy={props.autoBusy}
          />
        )}
        {tab === "saved" && <SavedPanel items={props.saved} onLoad={props.onLoadSaved} onDelete={props.onDeleteSaved} />}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-16 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium border-l-2 transition-colors",
        active
          ? "border-violet-500 bg-zinc-900 text-violet-300"
          : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function UploadPanel({
  onSet,
  onPaste,
  bg,
  onBgChange,
}: {
  onSet: (src: string, w: number, h: number) => void;
  onPaste: () => Promise<void> | void;
  bg: string;
  onBgChange: (c: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (f: File) => {
    const src = await readFileAsDataURL(f);
    const { width, height } = await loadImageSize(src);
    onSet(src, width, height);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">背景画像</h3>
        <p className="text-xs text-zinc-400 mb-3">
          動画のキャプチャ画像などをアップロード・貼り付けしてください。
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) await handleFile(f);
          }}
          className={cn(
            "w-full h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors",
            dragOver
              ? "border-violet-500 bg-violet-500/10 text-violet-200"
              : "border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/40 text-zinc-400 hover:text-violet-300"
          )}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">クリックまたはドラッグで選択</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            await handleFile(f);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
        <button
          onClick={() => onPaste()}
          className="mt-2 w-full px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-100 flex items-center justify-center gap-1.5 border border-zinc-700"
        >
          <Clipboard className="w-4 h-4" />
          クリップボードから貼り付け
        </button>
        <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
          ヒント: <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px]">⌘V</kbd>
          {" "}でどこからでも貼り付け可。QuickTime Playerの「映像をコピー」にも対応。
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-zinc-200">
          <Palette className="w-4 h-4" />
          背景色
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={bg}
            onChange={(e) => onBgChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer bg-transparent border border-zinc-700"
          />
          <input
            type="text"
            value={bg}
            onChange={(e) => onBgChange(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function TextPanel({ onAdd }: { onAdd: (text?: string, opts?: { fontSize?: number; fill?: string }) => void }) {
  const presets = [
    { label: "見出し（特大）", text: "テキスト", fontSize: 160, fill: "#ffffff" },
    { label: "見出し（大）", text: "テキスト", fontSize: 112, fill: "#ffffff" },
    { label: "強調（黄）", text: "必見", fontSize: 120, fill: "#fde047" },
    { label: "サブ見出し", text: "サブテキスト", fontSize: 72, fill: "#fde047" },
    { label: "本文", text: "本文テキスト", fontSize: 48, fill: "#ffffff" },
    { label: "ミニタグ", text: "タグ", fontSize: 36, fill: "#ffffff" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">テキストを追加</h3>
        <p className="text-xs text-zinc-400 mb-3">追加後、ダブルクリックで編集できます。</p>
        <button
          onClick={() => onAdd()}
          className="w-full px-3 py-2.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Type className="w-4 h-4" />
          テキストを追加
        </button>
      </div>
      <div>
        <h3 className="text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wider">プリセット</h3>
        <div className="space-y-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => onAdd(p.text, { fontSize: p.fontSize, fill: p.fill })}
              className="w-full text-left px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm flex items-center justify-between"
            >
              <span>{p.label}</span>
              <span className="text-[10px] text-zinc-500 font-mono">{p.fontSize}px</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImagePanel({ onAdd }: { onAdd: (src: string, w: number, h: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">画像レイヤー</h3>
        <p className="text-xs text-zinc-400 mb-3">ステッカーやロゴを追加できます。</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/40 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-violet-300 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-xs">画像を追加</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const src = await readFileAsDataURL(f);
            const { width, height } = await loadImageSize(src);
            onAdd(src, width, height);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
    </div>
  );
}

function ShapePanel({
  onAdd,
}: {
  onAdd: (
    shape: ShapeKind,
    opts?: Partial<{ fill: string; cornerRadius: number; width: number; height: number }>
  ) => void;
}) {
  const colors = [
    "#fde047",
    "#fb923c",
    "#ef4444",
    "#ec4899",
    "#a855f7",
    "#3b82f6",
    "#22c55e",
    "#ffffff",
    "#0f172a",
  ];
  const [fill, setFill] = useState("#fde047");

  const quickShapes: { label: string; icon: React.ReactNode; shape: ShapeKind; cornerRadius: number; w: number; h: number }[] = [
    { label: "四角", icon: <Square className="w-5 h-5" />, shape: "rect", cornerRadius: 0, w: 400, h: 200 },
    { label: "角丸", icon: <Square className="w-5 h-5 rounded-md" />, shape: "rect", cornerRadius: 32, w: 400, h: 200 },
    { label: "Pill", icon: <div className="w-6 h-3 rounded-full bg-current" />, shape: "rect", cornerRadius: 100, w: 400, h: 120 },
    { label: "楕円", icon: <Circle className="w-5 h-5" />, shape: "ellipse", cornerRadius: 0, w: 320, h: 320 },
    { label: "帯", icon: <div className="w-6 h-2 bg-current" />, shape: "rect", cornerRadius: 0, w: 1280, h: 120 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">図形を追加</h3>
        <p className="text-xs text-zinc-400 mb-3">
          文字の下に敷く強調帯や、数字を囲む円などに。
        </p>
        <div className="grid grid-cols-3 gap-2">
          {quickShapes.map((s) => (
            <button
              key={s.label}
              onClick={() => onAdd(s.shape, { cornerRadius: s.cornerRadius, fill, width: s.w, height: s.h })}
              className="aspect-square rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-300"
              style={{ color: fill }}
            >
              {s.icon}
              <span className="text-[10px] text-zinc-400">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wider">デフォルトの色</h3>
        <div className="grid grid-cols-9 gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setFill(c)}
              className={cn(
                "aspect-square rounded border-2 transition-transform",
                fill === c ? "border-violet-500 scale-110" : "border-zinc-700"
              )}
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-2 items-center">
          <input
            type="color"
            value={fill}
            onChange={(e) => setFill(e.target.value)}
            className="w-9 h-9 rounded cursor-pointer bg-transparent border border-zinc-700"
          />
          <input
            type="text"
            value={fill}
            onChange={(e) => setFill(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
}

function TemplatePanel({ onApply }: { onApply: (id: string) => void }) {
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Group by layoutId → list of (one entry per theme)
  const groups = LAYOUT_META.map((l) => ({
    layout: l,
    variants: TEMPLATES.filter((t) => t.layoutId === l.id),
  })).filter((g) => tagFilter === "all" || g.layout.tag === tagFilter);

  const allTags = Array.from(new Set(LAYOUT_META.map((l) => l.tag)));

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1 text-zinc-200 flex items-center gap-1.5">
          <LayoutTemplate className="w-4 h-4" />
          デザインテンプレート
        </h3>
        <p className="text-xs text-zinc-400 leading-snug">
          {TEMPLATES.length}パターン（レイアウト {LAYOUT_META.length} × カラー{" "}
          {TEMPLATES.length / LAYOUT_META.length}）。カラーチップをクリックで適用、テキストは後から編集できます。
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        <FilterPill active={tagFilter === "all"} onClick={() => setTagFilter("all")}>
          すべて
        </FilterPill>
        {allTags.map((tag) => (
          <FilterPill key={tag} active={tagFilter === tag} onClick={() => setTagFilter(tag)}>
            {tag}
          </FilterPill>
        ))}
      </div>

      <div className="space-y-3">
        {groups.map(({ layout, variants }) => (
          <div key={layout.id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] font-semibold text-zinc-100">
                {layout.label}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {layout.tag}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-snug mb-1.5">
              {layout.desc}
            </p>
            <div className="grid grid-cols-5 gap-1">
              {variants.map((t) => (
                <TemplateSwatch key={t.id} t={t} onClick={() => onApply(t.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
        active
          ? "bg-violet-500/25 border-violet-500 text-violet-100"
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
      )}
    >
      {children}
    </button>
  );
}

function TemplateSwatch({ t, onClick }: { t: TemplateDef; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={`${t.themeLabel} / ${t.layoutLabel}`}
      className="group relative rounded border border-zinc-700 hover:border-violet-500 overflow-hidden h-11 transition-colors"
    >
      <div className="flex h-full">
        {t.swatch.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/65 flex items-center justify-center transition-opacity px-1">
        <span className="text-[9px] text-white font-medium text-center leading-tight truncate">
          {t.themeLabel}
        </span>
      </div>
    </button>
  );
}

function AutoPanel({
  onGenerate,
  onApply,
  busy,
}: {
  onGenerate: (opts: { product: string; url: string; style: string; mode: "research" | "simple" }) => Promise<AutoResult | null>;
  onApply: (res: AutoResult, templateId?: string) => void;
  busy?: boolean;
}) {
  const [product, setProduct] = useState("");
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState("インパクト重視");
  const [result, setResult] = useState<AutoResult | null>(null);
  const [mode, setMode] = useState<"research" | "simple">("research");
  const [layoutFilterState, setLayoutFilterState] = useState<{
    key: string;
    value: string;
  }>({ key: "", value: "all" });

  const selectedPhrases = useResearchPhraseState(result);
  const allPhrases = () => selectedPhrases.selected;
  const previewPhrases = useMemo(
    () => buildTemplatePreviewPhrases(result, selectedPhrases.selected),
    [result, selectedPhrases.selected]
  );
  const recommendedTags = useMemo(
    () => getRecommendedTags(style, result?.category),
    [style, result?.category]
  );
  const recommendationKey = `${style}:${result?.category ?? "none"}`;
  if (layoutFilterState.key !== recommendationKey) {
    setLayoutFilterState({
      key: recommendationKey,
      value: recommendedTags[0] ?? "all",
    });
  }
  const layoutFilter = layoutFilterState.value;

  const previewTemplates = useMemo(
    () => {
      const phraseCount = previewPhrases.length;
      const filtered = DEFAULT_TEMPLATES_PER_LAYOUT.filter(
        (template) => layoutFilter === "all" || template.tag === layoutFilter
      );
      return [...filtered].sort((left, right) => {
        const leftScore = scoreTemplateForAuto(left, phraseCount, style, result?.category);
        const rightScore = scoreTemplateForAuto(right, phraseCount, style, result?.category);
        return rightScore - leftScore;
      });
    },
    [layoutFilter, previewPhrases.length, style, result?.category]
  );
  const autoTags = useMemo(
    () => Array.from(new Set(DEFAULT_TEMPLATES_PER_LAYOUT.map((template) => template.tag))),
    []
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-zinc-200">
          <Sparkles className="w-4 h-4 text-violet-400" />
          AI オートモード
        </h3>
        <p className="text-xs text-zinc-400">
          商品名を入れるとAIがリサーチして、<br />特徴・数字・評価を
          <strong className="text-violet-300">複数の短文</strong>で返します。必要なフレーズを選んで配置。
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!product.trim()) return;
          const r = await onGenerate({
            product: product.trim(),
            url: url.trim(),
            style,
            mode,
          });
          if (r) setResult(r);
        }}
        className="space-y-3"
      >
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-300">商品名 / 動画テーマ *</label>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="例: ソニー WH-1000XM5"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-300">参考URL（任意・精度UP）</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            公式サイトやAmazon商品ページを入れると精度が大幅UP
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-300">スタイル</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs"
            >
              <option>インパクト重視</option>
              <option>やわらかポップ</option>
              <option>高級感</option>
              <option>レビュー系</option>
              <option>解説系</option>
              <option>比較系</option>
              <option>ニュース系</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-300">モード</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "research" | "simple")}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs"
            >
              <option value="research">リサーチ(強)</option>
              <option value="simple">シンプル(速)</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !product.trim()}
          className="w-full px-3 py-2.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "AIがリサーチ中..." : "リサーチ＆生成"}
        </button>
      </form>

      {result && (
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-zinc-300">生成結果</h4>
            <button
              onClick={() => setResult(null)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              クリア
            </button>
          </div>

          <PhraseGroup
            label="メイン"
            phrases={pickOne(result.headline ?? result.mainText)}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="violet"
          />
          <PhraseGroup
            label="サブ"
            phrases={pickOne(result.subHeadline ?? result.subText)}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="blue"
          />
          <PhraseGroup
            label="特徴"
            phrases={result.features ?? []}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="emerald"
          />
          <PhraseGroup
            label="数字"
            phrases={result.stats ?? []}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="amber"
          />
          <PhraseGroup
            label="評価"
            phrases={result.verdicts ?? []}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="rose"
          />
          <PhraseGroup
            label="アクセント"
            phrases={pickOne(result.accent ?? result.accentText)}
            selected={selectedPhrases.selected}
            onToggle={selectedPhrases.toggle}
            accent="pink"
          />

          <div className="space-y-2 pt-1">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[10px] text-zinc-500">
                  レイアウトをサムネイルから選択
                </div>
                <div className="text-[9px] text-zinc-600">
                  {previewTemplates.length}件
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                <FilterPill
                  active={layoutFilter === "all"}
                  onClick={() => setLayoutFilterState({ key: recommendationKey, value: "all" })}
                >
                  すべて
                </FilterPill>
                {autoTags.map((tag) => (
                  <FilterPill key={tag} active={layoutFilter === tag} onClick={() => setLayoutFilterState({ key: recommendationKey, value: tag })}>
                    {tag}
                    {recommendedTags.includes(tag) ? " *" : ""}
                  </FilterPill>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {previewTemplates.map((t) => (
                  <TemplatePreviewCard
                    key={t.id}
                    template={t}
                    phrases={previewPhrases}
                    score={scoreTemplateForAuto(t, previewPhrases.length, style, result?.category)}
                    onClick={() => onApply(buildSelectedResult(result, allPhrases()), t.id)}
                  />
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 mt-1.5 leading-snug">
                クリックでそのまま配置します。現在の選択フレーズを最大6個まで反映します。`*` はスタイルに合うおすすめカテゴリです。
              </p>
            </div>
            <button
              onClick={() => onApply(buildSelectedResult(result, allPhrases()))}
              className="w-full px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700"
            >
              テンプレを使わずシンプル配置
            </button>
            <div>
              <div className="text-[10px] text-zinc-500 mb-1">
                テンプレート全体の色違いはテンプレタブから選択できます
              </div>
              <p className="text-[9px] text-zinc-600 leading-snug">
                現在 {DEFAULT_TEMPLATES_PER_LAYOUT.length} レイアウト / {TEMPLATES.length} パターンあります。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildSelectedResult(result: AutoResult, selected: string[]): AutoResult {
  const phrases = dedupePhrases(selected).slice(0, 6);
  return {
    ...result,
    headline: phrases[0] ?? result.headline ?? result.mainText,
    subHeadline: phrases[1] ?? result.subHeadline ?? result.subText,
    features: phrases.slice(2),
    stats: [],
    verdicts: [],
    accent: undefined,
    accentText: undefined,
  };
}

function buildTemplatePreviewPhrases(result: AutoResult | null, selected: string[]): string[] {
  const fallback = [
    result?.headline,
    result?.mainText,
    result?.subHeadline,
    result?.subText,
    ...(result?.features ?? []),
    ...(result?.stats ?? []),
    ...(result?.verdicts ?? []),
    result?.accent,
    result?.accentText,
    "要点1",
    "要点2",
    "要点3",
    "要点4",
  ];
  return dedupePhrases([...selected, ...fallback]).slice(0, 6);
}

function dedupePhrases(phrases: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const phrase of phrases) {
    const normalized = phrase?.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    list.push(normalized);
  }
  return list;
}

function TemplatePreviewCard({
  template,
  phrases,
  score,
  onClick,
}: {
  template: TemplateDef;
  phrases: string[];
  score: number;
  onClick: () => void;
}) {
  const elements = useMemo(() => {
    let index = 0;
    return template.build({
      canvasWidth: 1280,
      canvasHeight: 720,
      uid: () => `preview-${template.id}-${index++}`,
      phrases,
    });
  }, [template, phrases]);

  const fit = getTemplateFit(template.layoutId);

  return (
    <button
      onClick={onClick}
      title={`${template.layoutLabel} — ${template.desc}`}
      className="rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 hover:border-violet-500 hover:bg-zinc-800/70 transition-colors text-left"
    >
      <div className="relative aspect-video bg-zinc-950 overflow-hidden">
        {elements.map((element) => (
          <PreviewElement key={element.id} element={element} />
        ))}
        {score >= 7 && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-violet-500/85 text-[8px] font-semibold text-white">
            おすすめ
          </div>
        )}
      </div>
      <div className="px-2.5 py-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-zinc-100 truncate">{template.layoutLabel}</div>
          <div className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">
            {fit.label}
          </div>
        </div>
        <div className="text-[9px] text-zinc-500 line-clamp-2">{template.desc}</div>
      </div>
    </button>
  );
}

function getRecommendedTags(style: string, category?: AutoResult["category"]): string[] {
  const categoryMap: Partial<Record<NonNullable<AutoResult["category"]>, string[]>> = {
    review: ["見出し+強調", "リスト", "解説"],
    compare: ["比較", "リスト", "解説"],
    howto: ["解説", "リスト", "見出し+強調"],
    ranking: ["ランキング", "見出し+強調", "リスト"],
    news: ["見出し+強調", "見出し", "解説"],
    explainer: ["解説", "リスト", "比較"],
    sale: ["格安訴求", "見出し+強調", "ランキング"],
  };
  const styleMap: Record<string, string[]> = {
    インパクト重視: ["見出し+強調", "ランキング", "格安訴求"],
    やわらかポップ: ["見出し", "リスト", "見出し+強調"],
    高級感: ["解説", "ランキング", "見出し"],
    レビュー系: ["見出し+強調", "リスト", "解説"],
    解説系: ["解説", "リスト", "比較"],
    比較系: ["比較", "リスト", "解説"],
    ニュース系: ["見出し+強調", "見出し", "ランキング"],
  };
  return dedupePhrases([...(category ? categoryMap[category] ?? [] : []), ...(styleMap[style] ?? ["見出し+強調", "リスト"])]);
}

function getTemplateFit(layoutId: string): { min: number; max: number; label: string } {
  const fitMap: Record<string, { min: number; max: number; label: string }> = {
    "centered-hero": { min: 1, max: 2, label: "1-2語向き" },
    "bottom-bar": { min: 2, max: 3, label: "2-3語向き" },
    "top-bar": { min: 2, max: 3, label: "2-3語向き" },
    "corner-ribbon": { min: 2, max: 3, label: "2-3語向き" },
    "circle-stamp": { min: 2, max: 3, label: "2-3語向き" },
    "giant-number": { min: 2, max: 3, label: "2-3語向き" },
    "split-compare": { min: 3, max: 4, label: "3-4語向き" },
    "feature-3pill": { min: 3, max: 4, label: "3-4語向き" },
    "speech-bubble": { min: 1, max: 2, label: "1-2語向き" },
    "overlay-dark": { min: 2, max: 3, label: "2-3語向き" },
    "stacked-cards": { min: 4, max: 6, label: "4-6語向き" },
    "six-chip-grid": { min: 4, max: 6, label: "4-6語向き" },
    "left-steps": { min: 4, max: 6, label: "4-6語向き" },
    "checklist-box": { min: 4, max: 6, label: "4-6語向き" },
    "side-pill-tower": { min: 3, max: 6, label: "3-6語向き" },
    "bottom-ticket-row": { min: 3, max: 6, label: "3-6語向き" },
    "right-check-column": { min: 3, max: 6, label: "3-6語向き" },
    "top-rank-strip": { min: 3, max: 6, label: "3-6語向き" },
  };
  return fitMap[layoutId] ?? { min: 2, max: 4, label: "2-4語向き" };
}

function scoreTemplateForAuto(
  template: TemplateDef,
  phraseCount: number,
  style: string,
  category?: AutoResult["category"]
): number {
  const recommendedTags = getRecommendedTags(style, category);
  const fit = getTemplateFit(template.layoutId);
  let score = 0;
  if (recommendedTags[0] === template.tag) score += 4;
  else if (recommendedTags.includes(template.tag)) score += 2;
  if (phraseCount >= fit.min && phraseCount <= fit.max) score += 3;
  else score -= Math.min(Math.abs(phraseCount - fit.max), Math.abs(phraseCount - fit.min));
  if (template.tag === "比較" && category === "compare") score += 2;
  if (template.tag === "ランキング" && category === "ranking") score += 2;
  if (template.tag === "格安訴求" && category === "sale") score += 2;
  if (template.tag === "解説" && (category === "howto" || category === "explainer")) score += 2;
  return score;
}

function PreviewElement({ element }: { element: EditorElement }) {
  if (element.type === "image") return null;

  const baseStyle = {
    left: `${(element.x / 1280) * 100}%`,
    top: `${(element.y / 720) * 100}%`,
    opacity: element.opacity ?? 1,
    transform: `rotate(${element.rotation}deg) scale(${element.scaleX}, ${element.scaleY})`,
    transformOrigin: "top left",
  } as const;

  if (element.type === "shape") {
    return (
      <div
        className="absolute"
        style={{
          ...baseStyle,
          width: `${(element.width / 1280) * 100}%`,
          height: `${(element.height / 720) * 100}%`,
          background: element.fill,
          border: element.strokeWidth > 0 ? `${Math.max(1, element.strokeWidth * 0.12)}px solid ${element.stroke}` : undefined,
          borderRadius:
            element.shape === "ellipse"
              ? "999px"
              : `${Math.max(2, element.cornerRadius * 0.12)}px`,
        }}
      />
    );
  }

  return (
    <div
      className="absolute whitespace-pre-wrap overflow-hidden leading-tight"
      style={{
        ...baseStyle,
        width: `${(element.width / 1280) * 100}%`,
        color: element.fill,
        fontFamily: element.fontFamily,
        fontSize: `${Math.max(6, element.fontSize * 0.1)}px`,
        fontWeight: element.fontStyle.includes("bold") ? 700 : 400,
        fontStyle: element.fontStyle.includes("italic") ? "italic" : "normal",
        textAlign: element.align as TextElement["align"],
        lineHeight: element.lineHeight,
        textShadow: element.shadowEnabled
          ? `0 ${Math.max(1, element.shadowOffsetY * 0.12)}px ${Math.max(1, element.shadowBlur * 0.08)}px ${element.shadowColor}`
          : undefined,
      }}
    >
      {element.text}
    </div>
  );
}

function pickOne(v: string | undefined): string[] {
  return v && v.trim() ? [v] : [];
}

function useResearchPhraseState(result: AutoResult | null) {
  // "Reset state when prop changes" per React docs: store the input alongside
  // derived state and detect the change during render. React allows setState
  // during render for this specific pattern (schedules a re-render before
  // committing), and it's cheaper than a useEffect.
  const [state, setState] = useState<{ result: AutoResult | null; selected: string[] }>({
    result: null,
    selected: [],
  });
  if (state.result !== result) {
    const defaults: string[] = [];
    if (result?.headline) defaults.push(result.headline);
    if (result?.mainText) defaults.push(result.mainText);
    if (result?.subHeadline) defaults.push(result.subHeadline);
    if (result?.subText) defaults.push(result.subText);
    (result?.features ?? []).slice(0, 3).forEach((p) => defaults.push(p));
    setState({ result, selected: defaults });
  }

  const toggle = (phrase: string) => {
    setState((cur) => ({
      result: cur.result,
      selected: cur.selected.includes(phrase)
        ? cur.selected.filter((p) => p !== phrase)
        : [...cur.selected, phrase],
    }));
  };

  return { selected: state.selected, toggle };
}

function PhraseGroup({
  label,
  phrases,
  selected,
  onToggle,
  accent,
}: {
  label: string;
  phrases: string[];
  selected: string[];
  onToggle: (p: string) => void;
  accent: "violet" | "blue" | "emerald" | "amber" | "rose" | "pink";
}) {
  if (phrases.length === 0) return null;
  const accentClasses: Record<typeof accent, string> = {
    violet: "bg-violet-500/20 border-violet-500 text-violet-100",
    blue: "bg-blue-500/20 border-blue-500 text-blue-100",
    emerald: "bg-emerald-500/20 border-emerald-500 text-emerald-100",
    amber: "bg-amber-500/20 border-amber-500 text-amber-100",
    rose: "bg-rose-500/20 border-rose-500 text-rose-100",
    pink: "bg-pink-500/20 border-pink-500 text-pink-100",
  };
  return (
    <div>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {phrases.map((p) => {
          const on = selected.includes(p);
          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              className={cn(
                "px-2 py-1 rounded-md text-xs border whitespace-pre-wrap text-left",
                on
                  ? accentClasses[accent]
                  : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useLocalStorageUsage() {
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return;
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) ?? "";
        const val = localStorage.getItem(key) ?? "";
        total += (key.length + val.length) * 2; // UTF-16: 2 bytes per char
      }
      setUsedBytes(total);
    };
    calc();
  }, []);

  return usedBytes;
}

function StorageUsageBar({ usedBytes }: { usedBytes: number }) {
  const LIMIT = 5 * 1024 * 1024; // 5 MB (typical localStorage limit)
  const pct = Math.min((usedBytes / LIMIT) * 100, 100);
  const usedKB = (usedBytes / 1024).toFixed(1);
  const limitMB = (LIMIT / 1024 / 1024).toFixed(0);
  const color = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-400" : "bg-violet-500";

  return (
    <div className="mb-3 p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700">
      <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
        <span>保存容量の使用状況</span>
        <span>{usedKB} KB / {limitMB} MB</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-[10px] text-rose-400 mt-1.5">
          容量がほぼ満杯です。古いデータを削除してください。
        </p>
      )}
    </div>
  );
}

function SavedPanel({
  items,
  onLoad,
  onDelete,
}: {
  items: SavedThumbnail[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const usedBytes = useLocalStorageUsage();

  return (
    <div>
      <StorageUsageBar usedBytes={usedBytes} />
      <h3 className="text-sm font-semibold mb-3 text-zinc-200">保存済みサムネイル</h3>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">まだ保存されたものはありません。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="rounded-lg border border-zinc-800 bg-zinc-800/50 overflow-hidden">
              <button onClick={() => onLoad(it.id)} className="w-full text-left hover:bg-zinc-800">
                {it.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.preview} alt={it.name} className="w-full aspect-video object-cover" />
                )}
                <div className="px-2.5 py-2">
                  <div className="text-sm font-medium truncate">{it.name || "無題"}</div>
                  <div className="text-[10px] text-zinc-500">
                    {new Date(it.updatedAt).toLocaleString("ja-JP")}
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  if (confirm(`「${it.name || "無題"}」を削除しますか?`)) onDelete(it.id);
                }}
                className="w-full py-1 text-[11px] text-rose-300 hover:bg-rose-500/10"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
