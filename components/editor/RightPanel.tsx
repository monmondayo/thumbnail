"use client";

import { useMemo } from "react";
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Image as ImageIcon,
  Type,
  Lock,
} from "lucide-react";
import type { EditorElement, TextElement } from "@/lib/types";
import { JAPANESE_FONTS } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type Props = {
  elements: EditorElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onToggleVisibility: (id: string) => void;
};

export default function RightPanel({
  elements,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  onToggleVisibility,
}: Props) {
  const selected = useMemo(() => elements.find((e) => e.id === selectedId) ?? null, [elements, selectedId]);

  return (
    <div className="w-[300px] shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <Properties element={selected} onUpdate={(p) => onUpdate(selected.id, p)} />
        ) : (
          <div className="p-4 text-xs text-zinc-500">
            要素を選択するとここにプロパティが表示されます。
          </div>
        )}
      </div>
      <div className="border-t border-zinc-800 max-h-[45%] overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 bg-zinc-950/30">
          レイヤー
        </div>
        <div className="overflow-y-auto">
          {elements.length === 0 ? (
            <div className="p-4 text-xs text-zinc-500">レイヤーがありません。</div>
          ) : (
            <ul>
              {[...elements].reverse().map((el) => (
                <LayerRow
                  key={el.id}
                  el={el}
                  selected={el.id === selectedId}
                  onSelect={() => onSelect(el.id)}
                  onToggle={() => onToggleVisibility(el.id)}
                  onDelete={() => onDelete(el.id)}
                  onDuplicate={() => onDuplicate(el.id)}
                  onUp={() => onReorder(el.id, "up")}
                  onDown={() => onReorder(el.id, "down")}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function LayerRow({
  el,
  selected,
  onSelect,
  onToggle,
  onDelete,
  onDuplicate,
  onUp,
  onDown,
}: {
  el: EditorElement;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const label =
    el.type === "text"
      ? el.text.slice(0, 20) || "テキスト"
      : el.isBackground
      ? "背景画像"
      : "画像";
  return (
    <li
      onClick={onSelect}
      className={cn(
        "group px-3 py-2 border-b border-zinc-800 flex items-center gap-2 cursor-pointer text-xs",
        selected ? "bg-violet-600/20 text-violet-100" : "hover:bg-zinc-800"
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-zinc-400 hover:text-zinc-200"
        title={el.visible ? "非表示にする" : "表示する"}
      >
        {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      {el.type === "text" ? (
        <Type className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      ) : el.isBackground ? (
        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      ) : (
        <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
          className="p-1 hover:bg-zinc-700 rounded"
          title="上へ"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDown();
          }}
          className="p-1 hover:bg-zinc-700 rounded"
          title="下へ"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 hover:bg-zinc-700 rounded"
          title="複製"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-rose-500/20 rounded text-rose-300"
          title="削除"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

function Properties({
  element,
  onUpdate,
}: {
  element: EditorElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  if (element.type === "text") {
    return <TextProperties element={element} onUpdate={onUpdate} />;
  }
  return <ImageProperties element={element} onUpdate={onUpdate} />;
}

function TextProperties({
  element,
  onUpdate,
}: {
  element: TextElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  return (
    <div className="p-4 space-y-5">
      <Section title="テキスト">
        <textarea
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </Section>

      <Section title="フォント">
        <select
          value={element.fontFamily}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
        >
          {JAPANESE_FONTS.map((f) => (
            <option key={f.family} value={f.cssFamily} style={{ fontFamily: f.cssFamily }}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2 mt-2">
          <select
            value={element.fontStyle}
            onChange={(e) => onUpdate({ fontStyle: e.target.value })}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs"
          >
            <option value="normal">Regular</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="bold italic">Bold Italic</option>
          </select>
          <select
            value={element.align}
            onChange={(e) => onUpdate({ align: e.target.value as TextElement["align"] })}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs"
          >
            <option value="left">左寄せ</option>
            <option value="center">中央</option>
            <option value="right">右寄せ</option>
          </select>
        </div>
      </Section>

      <Section title={`サイズ ${Math.round(element.fontSize)}px`}>
        <input
          type="range"
          min={12}
          max={300}
          value={element.fontSize}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className="w-full"
        />
      </Section>

      <Section title={`行間 ${element.lineHeight.toFixed(2)}`}>
        <input
          type="range"
          min={0.8}
          max={2.5}
          step={0.05}
          value={element.lineHeight}
          onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })}
          className="w-full"
        />
      </Section>

      <Section title="文字色">
        <ColorInput value={element.fill} onChange={(v) => onUpdate({ fill: v })} />
      </Section>

      <Section title="輪郭線">
        <div className="space-y-2">
          <ColorInput value={element.stroke} onChange={(v) => onUpdate({ stroke: v })} />
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">太さ {element.strokeWidth}px</div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.5}
              value={element.strokeWidth}
              onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </Section>

      <Section title="影">
        <label className="flex items-center gap-2 text-xs mb-2">
          <input
            type="checkbox"
            checked={element.shadowEnabled}
            onChange={(e) => onUpdate({ shadowEnabled: e.target.checked })}
          />
          影を有効化
        </label>
        {element.shadowEnabled && (
          <div className="space-y-2">
            <ColorInput value={element.shadowColor} onChange={(v) => onUpdate({ shadowColor: v })} />
            <div>
              <div className="text-[10px] text-zinc-500 mb-0.5">ぼかし {element.shadowBlur}</div>
              <input
                type="range"
                min={0}
                max={60}
                value={element.shadowBlur}
                onChange={(e) => onUpdate({ shadowBlur: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 mb-0.5">X / Y オフセット</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={element.shadowOffsetX}
                  onChange={(e) => onUpdate({ shadowOffsetX: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={element.shadowOffsetY}
                  onChange={(e) => onUpdate({ shadowOffsetY: Number(e.target.value) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="折り返し幅">
        <input
          type="number"
          value={Math.round(element.width)}
          onChange={(e) => onUpdate({ width: Number(e.target.value) })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
        />
      </Section>

      <Transform element={element} onUpdate={onUpdate} />
    </div>
  );
}

function ImageProperties({
  element,
  onUpdate,
}: {
  element: Extract<EditorElement, { type: "image" }>;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  return (
    <div className="p-4 space-y-5">
      <Section title="画像">
        <img src={element.src} alt="" className="w-full rounded border border-zinc-800" />
        <p className="text-[10px] text-zinc-500 mt-1">
          {Math.round(element.width)}×{Math.round(element.height)} px
        </p>
      </Section>
      <Transform element={element} onUpdate={onUpdate} />
    </div>
  );
}

function Transform({
  element,
  onUpdate,
}: {
  element: EditorElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  return (
    <Section title="配置">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label>
          <span className="block text-zinc-500 mb-0.5">X</span>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => onUpdate({ x: Number(e.target.value) })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-zinc-500 mb-0.5">Y</span>
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => onUpdate({ y: Number(e.target.value) })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-zinc-500 mb-0.5">拡大X</span>
          <input
            type="number"
            step={0.01}
            value={element.scaleX.toFixed(2)}
            onChange={(e) => onUpdate({ scaleX: Number(e.target.value) })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
          />
        </label>
        <label>
          <span className="block text-zinc-500 mb-0.5">拡大Y</span>
          <input
            type="number"
            step={0.01}
            value={element.scaleY.toFixed(2)}
            onChange={(e) => onUpdate({ scaleY: Number(e.target.value) })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
          />
        </label>
        <label className="col-span-2">
          <span className="block text-zinc-500 mb-0.5">回転 (度)</span>
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
          />
        </label>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded cursor-pointer bg-transparent border border-zinc-700"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono"
      />
    </div>
  );
}
