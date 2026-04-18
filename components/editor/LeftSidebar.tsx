"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Type, Sparkles, Upload, FolderOpen, Palette } from "lucide-react";
import { cn, readFileAsDataURL, loadImageSize } from "@/lib/utils";
import type { SavedThumbnail } from "@/lib/types";

type Tab = "upload" | "text" | "image" | "auto" | "saved";

type Props = {
  onSetBackground: (src: string, width: number, height: number) => void;
  onAddText: (text?: string, opts?: { fontSize?: number; fill?: string }) => void;
  onAddImage: (src: string, width: number, height: number) => void;
  onAutoGenerate: (product: string, url: string, style: string) => Promise<void>;
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
    <div className="w-[320px] shrink-0 border-r border-zinc-800 bg-zinc-900 flex">
      <div className="flex flex-col w-16 border-r border-zinc-800 bg-zinc-950/50">
        <TabBtn active={tab === "upload"} onClick={() => setTab("upload")} icon={<Upload className="w-5 h-5" />} label="背景" />
        <TabBtn active={tab === "text"} onClick={() => setTab("text")} icon={<Type className="w-5 h-5" />} label="テキスト" />
        <TabBtn active={tab === "image"} onClick={() => setTab("image")} icon={<ImageIcon className="w-5 h-5" />} label="画像" />
        <TabBtn active={tab === "auto"} onClick={() => setTab("auto")} icon={<Sparkles className="w-5 h-5" />} label="AI" />
        <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<FolderOpen className="w-5 h-5" />} label="保存" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "upload" && <UploadPanel onSet={props.onSetBackground} bg={props.canvasBg} onBgChange={props.onCanvasBgChange} />}
        {tab === "text" && <TextPanel onAdd={props.onAddText} />}
        {tab === "image" && <ImagePanel onAdd={props.onAddImage} />}
        {tab === "auto" && <AutoPanel onGenerate={props.onAutoGenerate} busy={props.autoBusy} />}
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
  bg,
  onBgChange,
}: {
  onSet: (src: string, w: number, h: number) => void;
  bg: string;
  onBgChange: (c: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">背景画像</h3>
        <p className="text-xs text-zinc-400 mb-3">動画のキャプチャ画像などをアップロードしてください。</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/40 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-violet-300 transition-colors"
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
            const src = await readFileAsDataURL(f);
            const { width, height } = await loadImageSize(src);
            onSet(src, width, height);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
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
    { label: "見出し（特大）", text: "テキスト", fontSize: 140, fill: "#ffffff" },
    { label: "見出し（大）", text: "テキスト", fontSize: 96, fill: "#ffffff" },
    { label: "サブ見出し", text: "テキスト", fontSize: 64, fill: "#fde047" },
    { label: "本文", text: "テキスト", fontSize: 40, fill: "#ffffff" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-zinc-200">テキストを追加</h3>
        <p className="text-xs text-zinc-400 mb-3">追加後、キャンバス上でダブルクリックして編集できます。</p>
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
              className="w-full text-left px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              {p.label}
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

function AutoPanel({
  onGenerate,
  busy,
}: {
  onGenerate: (product: string, url: string, style: string) => Promise<void>;
  busy?: boolean;
}) {
  const [product, setProduct] = useState("");
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState("インパクト重視");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!product.trim()) return;
        await onGenerate(product.trim(), url.trim(), style);
      }}
      className="space-y-4"
    >
      <div>
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-zinc-200">
          <Sparkles className="w-4 h-4 text-violet-400" />
          AI オートモード
        </h3>
        <p className="text-xs text-zinc-400">商品名と参考URLからAIがサムネイル用の日本語テキストを自動生成します。</p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-zinc-300">商品名 / 動画テーマ *</label>
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="例: ワイヤレスノイズキャンセリングイヤホン"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-zinc-300">参考URL（任意）</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <p className="text-[10px] text-zinc-500 mt-1">公式サイトのURLを入れると特徴を反映します</p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-zinc-300">スタイル</label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
        >
          <option>インパクト重視</option>
          <option>やわらかポップ</option>
          <option>高級感</option>
          <option>レビュー系</option>
          <option>解説系</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={busy || !product.trim()}
        className="w-full px-3 py-2.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        <Sparkles className="w-4 h-4" />
        {busy ? "生成中..." : "テキストを生成して配置"}
      </button>
    </form>
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
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-zinc-200">保存済みサムネイル</h3>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-6">まだ保存されたものはありません。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="rounded-lg border border-zinc-800 bg-zinc-800/50 overflow-hidden">
              <button onClick={() => onLoad(it.id)} className="w-full text-left hover:bg-zinc-800">
                {it.preview && (
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
