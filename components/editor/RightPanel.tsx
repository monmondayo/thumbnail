"use client";

import { useMemo, useState } from "react";
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
  Shapes,
} from "lucide-react";
import type {
  EditorElement,
  GradientConfig,
  ShapeElement,
  TextElement,
} from "@/lib/types";
import {
  JAPANESE_FONTS,
  GRADIENT_PRESETS,
  derivedPresetsFromBase,
  type GradientPreset,
} from "@/lib/fonts";
import { cn } from "@/lib/utils";

type Props = {
  elements: EditorElement[];
  selectedId: string | null;
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { additive?: boolean }) => void;
  onUpdate: (id: string, patch: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteSelection: () => void;
  onDuplicateSelection: () => void;
  onTextAlignSelection: (align: TextElement["align"]) => void;
  onAlignObjects: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onReorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
  onToggleVisibility: (id: string) => void;
};

export default function RightPanel({
  elements,
  selectedId,
  selectedIds,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onDeleteSelection,
  onDuplicateSelection,
  onTextAlignSelection,
  onAlignObjects,
  onReorder,
  onToggleVisibility,
}: Props) {
  const selected = useMemo(() => elements.find((e) => e.id === selectedId) ?? null, [elements, selectedId]);
  const selectedCount = selectedIds.length;

  return (
    <div className="w-[300px] shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {selectedCount > 0 && (
          <BulkActions
            selectedCount={selectedCount}
            onDeleteSelection={onDeleteSelection}
            onDuplicateSelection={onDuplicateSelection}
            onTextAlignSelection={onTextAlignSelection}
            onAlignObjects={onAlignObjects}
          />
        )}
        {selected ? (
          <Properties
            element={selected}
            onUpdate={(p) => onUpdate(selected.id, p)}
            onDelete={() => onDelete(selected.id)}
            onDuplicate={() => onDuplicate(selected.id)}
          />
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
                  selected={selectedIds.includes(el.id)}
                  onSelect={(evt) =>
                    onSelect(el.id, {
                      additive: evt.shiftKey || evt.metaKey || evt.ctrlKey,
                    })
                  }
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
  onSelect: (evt: React.MouseEvent<HTMLLIElement>) => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const label =
    el.type === "text"
      ? el.text.slice(0, 20) || "テキスト"
      : el.type === "shape"
      ? el.shape === "ellipse" ? "楕円" : "四角形"
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
        title={el.visible ? "非表示" : "表示"}
      >
        {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      {el.type === "text" ? (
        <Type className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      ) : el.type === "shape" ? (
        <Shapes className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      ) : el.isBackground ? (
        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      ) : (
        <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconBtn icon={<ArrowUp className="w-3 h-3" />} onClick={onUp} title="上へ" />
        <IconBtn icon={<ArrowDown className="w-3 h-3" />} onClick={onDown} title="下へ" />
        <IconBtn icon={<Copy className="w-3 h-3" />} onClick={onDuplicate} title="複製" />
        <IconBtn
          icon={<Trash2 className="w-3 h-3" />}
          onClick={onDelete}
          title="削除"
          className="hover:bg-rose-500/20 text-rose-300"
        />
      </div>
    </li>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  className,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn("p-1 hover:bg-zinc-700 rounded", className)}
      title={title}
    >
      {icon}
    </button>
  );
}

function Properties({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  element: EditorElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div>
      <div className="px-4 pt-3 pb-2 flex gap-2">
        <button
          onClick={onDuplicate}
          className="flex-1 flex items-center justify-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded px-2 py-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          複製 <kbd className="font-mono text-[10px] text-zinc-500">⌘D</kbd>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 text-xs bg-zinc-800 hover:bg-rose-500/20 text-rose-300 rounded px-3 py-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {element.type === "text" ? (
        <TextProperties element={element} onUpdate={onUpdate} />
      ) : element.type === "shape" ? (
        <ShapeProperties element={element} onUpdate={onUpdate} />
      ) : (
        <ImageProperties element={element} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function BulkActions({
  selectedCount,
  onDeleteSelection,
  onDuplicateSelection,
  onTextAlignSelection,
  onAlignObjects,
}: {
  selectedCount: number;
  onDeleteSelection: () => void;
  onDuplicateSelection: () => void;
  onTextAlignSelection: (align: TextElement["align"]) => void;
  onAlignObjects: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
}) {
  return (
    <div className="px-4 pt-3 pb-2 border-b border-zinc-800 space-y-3 bg-zinc-950/20">
      <div className="text-xs text-zinc-400">{selectedCount} 件選択中（Shift/Cmd/Ctrl+クリックで複数選択）</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDuplicateSelection}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded px-2 py-1.5"
        >
          選択を複製
        </button>
        <button
          onClick={onDeleteSelection}
          className="text-xs bg-zinc-800 hover:bg-rose-500/20 text-rose-300 rounded px-2 py-1.5"
        >
          選択を削除
        </button>
      </div>

      <div>
        <div className="text-[10px] text-zinc-500 mb-1">テキスト揃え（選択中のテキストへ適用）</div>
        <div className="grid grid-cols-3 gap-1">
          <button onClick={() => onTextAlignSelection("left")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">左</button>
          <button onClick={() => onTextAlignSelection("center")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">中央</button>
          <button onClick={() => onTextAlignSelection("right")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">右</button>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-zinc-500 mb-1">オブジェクト整列（キャンバス基準）</div>
        <div className="grid grid-cols-3 gap-1">
          <button onClick={() => onAlignObjects("left")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">左</button>
          <button onClick={() => onAlignObjects("center")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">中央</button>
          <button onClick={() => onAlignObjects("right")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">右</button>
          <button onClick={() => onAlignObjects("top")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">上</button>
          <button onClick={() => onAlignObjects("middle")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">中央Y</button>
          <button onClick={() => onAlignObjects("bottom")} className="text-xs bg-zinc-800 hover:bg-zinc-700 rounded py-1.5">下</button>
        </div>
      </div>
    </div>
  );
}

function TextProperties({
  element,
  onUpdate,
}: {
  element: TextElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  return (
    <div className="px-4 pb-4 space-y-5">
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
          max={320}
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

      <Section title={`字間 ${(element.letterSpacing ?? 0).toFixed(1)}px`}>
        <input
          type="range"
          min={-5}
          max={30}
          step={0.5}
          value={element.letterSpacing ?? 0}
          onChange={(e) => onUpdate({ letterSpacing: Number(e.target.value) })}
          className="w-full"
        />
      </Section>

      <Section title="文字色">
        <ColorInput value={element.fill} onChange={(v) => onUpdate({ fill: v })} />
      </Section>

      <GradientSection
        gradient={element.gradient}
        baseColor={element.fill}
        onChange={(g) => onUpdate({ gradient: g })}
      />

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

      <OpacitySection element={element} onUpdate={onUpdate} />

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

function ShapeProperties({
  element,
  onUpdate,
}: {
  element: ShapeElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  return (
    <div className="px-4 pb-4 space-y-5">
      <Section title="形状">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onUpdate({ shape: "rect" })}
            className={cn(
              "py-2 rounded border text-xs",
              element.shape === "rect"
                ? "bg-violet-600/20 border-violet-500 text-violet-100"
                : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            )}
          >
            四角形
          </button>
          <button
            onClick={() => onUpdate({ shape: "ellipse" })}
            className={cn(
              "py-2 rounded border text-xs",
              element.shape === "ellipse"
                ? "bg-violet-600/20 border-violet-500 text-violet-100"
                : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            )}
          >
            楕円
          </button>
        </div>
      </Section>

      <Section title="サイズ">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label>
            <span className="block text-zinc-500 mb-0.5">幅</span>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
            />
          </label>
          <label>
            <span className="block text-zinc-500 mb-0.5">高さ</span>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
            />
          </label>
        </div>
      </Section>

      {element.shape === "rect" && (
        <Section title={`角丸 ${element.cornerRadius}px`}>
          <input
            type="range"
            min={0}
            max={200}
            value={element.cornerRadius}
            onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex gap-1 mt-1">
            {[0, 8, 16, 32, 100].map((r) => (
              <button
                key={r}
                onClick={() => onUpdate({ cornerRadius: r })}
                className="px-2 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded"
              >
                {r === 100 ? "Pill" : r}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="塗りつぶし">
        <ColorInput value={element.fill} onChange={(v) => onUpdate({ fill: v })} />
      </Section>

      <GradientSection
        gradient={element.gradient}
        baseColor={element.fill}
        onChange={(g) => onUpdate({ gradient: g })}
      />

      <Section title="枠線">
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

      <OpacitySection element={element} onUpdate={onUpdate} />

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
    <div className="px-4 pb-4 space-y-5">
      <Section title="画像">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={element.src} alt="" className="w-full rounded border border-zinc-800" />
        <p className="text-[10px] text-zinc-500 mt-1">
          {Math.round(element.width)}×{Math.round(element.height)} px
        </p>
      </Section>
      <Section title={`角丸 ${element.cornerRadius ?? 0}px`}>
        <input
          type="range"
          min={0}
          max={200}
          value={element.cornerRadius ?? 0}
          onChange={(e) => onUpdate({ cornerRadius: Number(e.target.value) })}
          className="w-full"
        />
      </Section>
      <OpacitySection element={element} onUpdate={onUpdate} />
      <Transform element={element} onUpdate={onUpdate} />
    </div>
  );
}

function OpacitySection({
  element,
  onUpdate,
}: {
  element: EditorElement;
  onUpdate: (patch: Partial<EditorElement>) => void;
}) {
  const v = element.opacity ?? 1;
  return (
    <Section title={`不透明度 ${Math.round(v * 100)}%`}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={v}
        onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
        className="w-full"
      />
    </Section>
  );
}

function GradientSection({
  gradient,
  baseColor,
  onChange,
}: {
  gradient: GradientConfig | undefined;
  baseColor: string;
  onChange: (g: GradientConfig | undefined) => void;
}) {
  const enabled = gradient?.enabled ?? false;
  const g: GradientConfig =
    gradient ?? {
      enabled: false,
      type: "linear",
      angle: 90,
      stops: [
        { offset: 0, color: baseColor },
        { offset: 1, color: "#000000" },
      ],
    };
  const toggle = (v: boolean) => onChange({ ...g, enabled: v });
  const setStops = (stops: { offset: number; color: string }[]) =>
    onChange({ ...g, enabled: true, stops });
  const setAngle = (angle: number) => onChange({ ...g, enabled: true, angle });
  const setType = (type: "linear" | "radial") =>
    onChange({ ...g, enabled: true, type });

  const applyPreset = (p: GradientPreset) => {
    const stops = p.colors.map((c, i, arr) => ({
      offset: arr.length === 1 ? 0 : i / (arr.length - 1),
      color: c,
    }));
    onChange({
      enabled: true,
      type: g.type,
      angle: p.angle ?? g.angle,
      stops,
    });
  };

  const derived = derivedPresetsFromBase(baseColor);

  return (
    <Section title="グラデーション">
      <label className="flex items-center gap-2 text-xs mb-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
        />
        グラデーションを有効化
      </label>

      {enabled && (
        <div className="space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("linear")}
              className={cn(
                "flex-1 py-1.5 rounded border text-[11px]",
                g.type === "linear"
                  ? "bg-violet-600/20 border-violet-500 text-violet-100"
                  : "bg-zinc-800 border-zinc-700"
              )}
            >
              直線
            </button>
            <button
              onClick={() => setType("radial")}
              className={cn(
                "flex-1 py-1.5 rounded border text-[11px]",
                g.type === "radial"
                  ? "bg-violet-600/20 border-violet-500 text-violet-100"
                  : "bg-zinc-800 border-zinc-700"
              )}
            >
              放射状
            </button>
          </div>

          {g.type === "linear" && (
            <div>
              <div className="text-[10px] text-zinc-500 mb-0.5">角度 {g.angle}°</div>
              <input
                type="range"
                min={0}
                max={360}
                value={g.angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Color stops editor */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-500">カラーストップ</div>
            {g.stops.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => {
                    const next = [...g.stops];
                    next[i] = { ...s, color: e.target.value };
                    setStops(next);
                  }}
                  className="w-8 h-8 rounded bg-transparent border border-zinc-700 cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={s.offset}
                  onChange={(e) => {
                    const next = [...g.stops];
                    next[i] = { ...s, offset: Number(e.target.value) };
                    setStops(next);
                  }}
                  className="flex-1"
                />
                <span className="text-[10px] text-zinc-500 w-8 font-mono">
                  {Math.round(s.offset * 100)}
                </span>
                {g.stops.length > 2 && (
                  <button
                    onClick={() => setStops(g.stops.filter((_, j) => j !== i))}
                    className="p-0.5 text-rose-300 hover:bg-rose-500/10 rounded"
                    title="削除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {g.stops.length < 6 && (
              <button
                onClick={() =>
                  setStops([
                    ...g.stops,
                    { offset: 1, color: "#ffffff" },
                  ])
                }
                className="w-full text-[11px] py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700"
              >
                + ストップ追加
              </button>
            )}
          </div>

          {/* Base-derived presets */}
          <div>
            <div className="text-[10px] text-zinc-500 mb-1">
              選択色「{baseColor}」ベースの候補
            </div>
            <div className="grid grid-cols-3 gap-1">
              {derived.map((p, i) => (
                <PresetSwatch key={`d-${i}`} preset={p} onClick={() => applyPreset(p)} />
              ))}
            </div>
          </div>

          {/* Classic presets */}
          <div>
            <div className="text-[10px] text-zinc-500 mb-1">定番パターン</div>
            <div className="grid grid-cols-3 gap-1">
              {GRADIENT_PRESETS.map((p, i) => (
                <PresetSwatch key={`p-${i}`} preset={p} onClick={() => applyPreset(p)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function PresetSwatch({ preset, onClick }: { preset: GradientPreset; onClick: () => void }) {
  const bg = `linear-gradient(${(preset.angle ?? 90) - 90}deg, ${preset.colors.join(",")})`;
  return (
    <button
      onClick={onClick}
      className="h-8 rounded border border-zinc-700 hover:border-violet-500 relative overflow-hidden text-[10px] text-white/90"
      style={{ background: bg }}
      title={preset.label}
    >
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
        {preset.label}
      </span>
    </button>
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
  const [local, setLocal] = useState(value);
  // Keep local state in sync when an outside update happens (e.g. template apply)
  if (local !== value && !document.activeElement?.matches("input")) {
    setTimeout(() => setLocal(value), 0);
  }
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
        }}
        className="w-9 h-9 rounded cursor-pointer bg-transparent border border-zinc-700"
      />
      <input
        type="text"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value);
        }}
        onBlur={() => setLocal(value)}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono"
      />
    </div>
  );
}
