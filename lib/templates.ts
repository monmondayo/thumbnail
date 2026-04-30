/**
 * Design templates — 100 patterns generated from (10 themes × 10 layouts).
 *
 * A *theme* = color palette + font choice (e.g. 黄×黒, 紺×金, シアン).
 * A *layout* = spatial arrangement (e.g. 中央ヒーロー, 下部ハイライト, 巨大数字).
 * Every (theme, layout) pair becomes a TemplateDef. Applying one returns
 * fresh EditorElements that the caller stacks on top of the current canvas.
 *
 * Note: Noto Sans JP is the neutral baseline so freshly-applied templates do
 * not start from extra-bold pop lettering. Decorative fonts remain available
 * as theme accents where they fit the mood.
 */
import type {
  EditorElement,
  GradientStop,
  ShapeElement,
  TextElement,
} from "./types";

export type TemplateContext = {
  /** 1280 by default */
  canvasWidth: number;
  /** 720 by default */
  canvasHeight: number;
  /** Produce fresh IDs; pass in `uid` from utils */
  uid: () => string;
  /**
   * Short phrases to inject into the layout.
   * phrases[0] is the primary headline;
   * phrases[1..] are interpreted per-layout (sub, accent, list items, etc.).
   */
  phrases?: string[];
};

export type TemplateCategory =
  | "見出し"
  | "見出し+強調"
  | "リスト"
  | "比較"
  | "格安訴求"
  | "解説"
  | "ランキング";

export type TemplateDef = {
  id: string;
  name: string;
  desc: string;
  tag: TemplateCategory;
  /** Theme metadata (for UI filtering / swatch preview) */
  themeId: string;
  themeLabel: string;
  /** Layout metadata (for grouping in UI) */
  layoutId: string;
  layoutLabel: string;
  /** 2-4 colors used for the UI chip swatch */
  swatch: string[];
  build: (ctx: TemplateContext) => EditorElement[];
};

// ─── Font aliases ──────────────────────────────────────────────
const F = {
  pottaOne: '"Potta One", sans-serif',
  rampart: '"Rampart One", sans-serif',
  reggae: '"Reggae One", cursive',
  rocknroll: '"RocknRoll One", sans-serif',
  train: '"Train One", sans-serif',
  mochiyPop: '"Mochiy Pop One", sans-serif',
  mplus1p: '"M PLUS 1p", sans-serif',
  mplusRounded: '"M PLUS Rounded 1c", sans-serif',
  zenMaru: '"Zen Maru Gothic", sans-serif',
  notoSans: '"Noto Sans JP", sans-serif',
  notoSerif: '"Noto Serif JP", serif',
  shippori: '"Shippori Mincho", serif',
  klee: '"Klee One", cursive',
  yuseiMagic: '"Yusei Magic", sans-serif',
  yomogi: '"Yomogi", cursive',
  dotGothic: '"DotGothic16", sans-serif',
  hachimaru: '"Hachi Maru Pop", cursive',
};

// ─── Element factories ────────────────────────────────────────
const baseShape = (patch: Partial<ShapeElement>): ShapeElement => ({
  id: "",
  type: "shape",
  shape: "rect",
  x: 0,
  y: 0,
  width: 200,
  height: 80,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  visible: true,
  fill: "#fde047",
  stroke: "transparent",
  strokeWidth: 0,
  cornerRadius: 16,
  opacity: 1,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 20,
  shadowOffsetX: 0,
  shadowOffsetY: 6,
  shadowOpacity: 0.3,
  ...patch,
});

const baseText = (patch: Partial<TextElement>): TextElement => ({
  id: "",
  type: "text",
  text: "テキスト",
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  visible: true,
  fontFamily: F.notoSans,
  fontSize: 140,
  fontStyle: "normal",
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 10,
  align: "center",
  width: 1080,
  lineHeight: 1.1,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 18,
  shadowOffsetX: 4,
  shadowOffsetY: 6,
  shadowOpacity: 0.6,
  opacity: 1,
  ...patch,
});

function withIds<T extends { id: string }>(items: T[], uid: () => string): T[] {
  return items.map((item) => ({ ...item, id: uid() }));
}

// ─── Themes (color + font) ────────────────────────────────────
type Theme = {
  id: string;
  label: string;
  /** Primary headline fill */
  mainFill: string;
  mainStroke: string;
  mainStrokeWidth: number;
  mainFont: string;
  /** Secondary / smaller text */
  subFill: string;
  subStroke: string;
  subStrokeWidth: number;
  subFont: string;
  /** Accent background for ribbons/pills/circles */
  accentBg: string;
  accentText: string;
  accentFont: string;
  /** Dark band color for "explainer" layouts */
  darkOverlay: string;
  darkOverlayText: string;
  /** 3-stop radial gradient for circular stamps */
  stampStops: GradientStop[];
  /** UI chip swatch (first color is the dominant tone) */
  swatch: string[];
};

const THEMES: Theme[] = [
  {
    id: "yellow-bold",
    label: "黄×黒",
    mainFill: "#fde047",
    mainStroke: "#0f0f10",
    mainStrokeWidth: 14,
    mainFont: F.notoSans,
    subFill: "#ffffff",
    subStroke: "#000000",
    subStrokeWidth: 6,
    subFont: F.notoSans,
    accentBg: "#fde047",
    accentText: "#0f0f10",
    accentFont: F.notoSans,
    darkOverlay: "#0f172a",
    darkOverlayText: "#ffffff",
    stampStops: [
      { offset: 0, color: "#fef9c3" },
      { offset: 0.6, color: "#facc15" },
      { offset: 1, color: "#a16207" },
    ],
    swatch: ["#fde047", "#0f0f10", "#ffffff"],
  },
  {
    id: "red-shout",
    label: "赤叫び",
    mainFill: "#ffffff",
    mainStroke: "#dc2626",
    mainStrokeWidth: 14,
    mainFont: F.rampart,
    subFill: "#fde047",
    subStroke: "#7f1d1d",
    subStrokeWidth: 6,
    subFont: F.mplusRounded,
    accentBg: "#dc2626",
    accentText: "#ffffff",
    accentFont: F.rampart,
    darkOverlay: "#1f2937",
    darkOverlayText: "#ffffff",
    stampStops: [
      { offset: 0, color: "#fecaca" },
      { offset: 0.6, color: "#ef4444" },
      { offset: 1, color: "#7f1d1d" },
    ],
    swatch: ["#dc2626", "#ffffff", "#fde047"],
  },
  {
    id: "cyan-tech",
    label: "シアン",
    mainFill: "#22d3ee",
    mainStroke: "#0f172a",
    mainStrokeWidth: 12,
    mainFont: F.rocknroll,
    subFill: "#ffffff",
    subStroke: "#0f172a",
    subStrokeWidth: 5,
    subFont: F.notoSans,
    accentBg: "#06b6d4",
    accentText: "#0f172a",
    accentFont: F.rocknroll,
    darkOverlay: "#0f172a",
    darkOverlayText: "#ffffff",
    stampStops: [
      { offset: 0, color: "#cffafe" },
      { offset: 0.6, color: "#22d3ee" },
      { offset: 1, color: "#155e75" },
    ],
    swatch: ["#22d3ee", "#0f172a", "#ffffff"],
  },
  {
    id: "pink-pop",
    label: "桃ポップ",
    mainFill: "#ffffff",
    mainStroke: "#ec4899",
    mainStrokeWidth: 13,
    mainFont: F.mochiyPop,
    subFill: "#fde047",
    subStroke: "#be185d",
    subStrokeWidth: 5,
    subFont: F.mochiyPop,
    accentBg: "#ec4899",
    accentText: "#ffffff",
    accentFont: F.mochiyPop,
    darkOverlay: "#500724",
    darkOverlayText: "#ffffff",
    stampStops: [
      { offset: 0, color: "#fce7f3" },
      { offset: 0.6, color: "#ec4899" },
      { offset: 1, color: "#831843" },
    ],
    swatch: ["#ec4899", "#ffffff", "#fde047"],
  },
  {
    id: "lime-fresh",
    label: "ライム",
    mainFill: "#d9f99d",
    mainStroke: "#14532d",
    mainStrokeWidth: 12,
    mainFont: F.zenMaru,
    subFill: "#ffffff",
    subStroke: "#14532d",
    subStrokeWidth: 5,
    subFont: F.zenMaru,
    accentBg: "#84cc16",
    accentText: "#0f0f10",
    accentFont: F.pottaOne,
    darkOverlay: "#14532d",
    darkOverlayText: "#d9f99d",
    stampStops: [
      { offset: 0, color: "#ecfccb" },
      { offset: 0.6, color: "#84cc16" },
      { offset: 1, color: "#365314" },
    ],
    swatch: ["#84cc16", "#14532d", "#d9f99d"],
  },
  {
    id: "orange-heat",
    label: "橙ヒート",
    mainFill: "#fed7aa",
    mainStroke: "#0f0f10",
    mainStrokeWidth: 13,
    mainFont: F.reggae,
    subFill: "#ffffff",
    subStroke: "#0f0f10",
    subStrokeWidth: 5,
    subFont: F.mplusRounded,
    accentBg: "#f97316",
    accentText: "#ffffff",
    accentFont: F.reggae,
    darkOverlay: "#431407",
    darkOverlayText: "#fed7aa",
    stampStops: [
      { offset: 0, color: "#fed7aa" },
      { offset: 0.6, color: "#f97316" },
      { offset: 1, color: "#7c2d12" },
    ],
    swatch: ["#f97316", "#fed7aa", "#0f0f10"],
  },
  {
    id: "navy-luxe",
    label: "紺×金",
    mainFill: "#fbbf24",
    mainStroke: "#0c1744",
    mainStrokeWidth: 10,
    mainFont: F.shippori,
    subFill: "#fef9c3",
    subStroke: "#0c1744",
    subStrokeWidth: 4,
    subFont: F.notoSerif,
    accentBg: "#fbbf24",
    accentText: "#0c1744",
    accentFont: F.notoSerif,
    darkOverlay: "#0c1744",
    darkOverlayText: "#fbbf24",
    stampStops: [
      { offset: 0, color: "#fef9c3" },
      { offset: 0.6, color: "#fbbf24" },
      { offset: 1, color: "#78350f" },
    ],
    swatch: ["#0c1744", "#fbbf24", "#ffffff"],
  },
  {
    id: "gold-premium",
    label: "ゴールド",
    mainFill: "#fef3c7",
    mainStroke: "#713f12",
    mainStrokeWidth: 10,
    mainFont: F.shippori,
    subFill: "#fde047",
    subStroke: "#713f12",
    subStrokeWidth: 4,
    subFont: F.shippori,
    accentBg: "#fbbf24",
    accentText: "#1c1917",
    accentFont: F.shippori,
    darkOverlay: "#1c1917",
    darkOverlayText: "#fbbf24",
    stampStops: [
      { offset: 0, color: "#fef9c3" },
      { offset: 0.5, color: "#fbbf24" },
      { offset: 1, color: "#78350f" },
    ],
    swatch: ["#fbbf24", "#1c1917", "#fef3c7"],
  },
  {
    id: "mono-editorial",
    label: "モノトーン",
    mainFill: "#ffffff",
    mainStroke: "#0f0f10",
    mainStrokeWidth: 12,
    mainFont: F.mplus1p,
    subFill: "#fde047",
    subStroke: "#000000",
    subStrokeWidth: 5,
    subFont: F.notoSans,
    accentBg: "#0f0f10",
    accentText: "#ffffff",
    accentFont: F.notoSans,
    darkOverlay: "#0f0f10",
    darkOverlayText: "#ffffff",
    stampStops: [
      { offset: 0, color: "#f4f4f5" },
      { offset: 0.6, color: "#52525b" },
      { offset: 1, color: "#0f0f10" },
    ],
    swatch: ["#0f0f10", "#ffffff", "#fde047"],
  },
  {
    id: "sunset-mood",
    label: "サンセット",
    mainFill: "#fde047",
    mainStroke: "#7c2d12",
    mainStrokeWidth: 12,
    mainFont: F.pottaOne,
    subFill: "#ffffff",
    subStroke: "#7c2d12",
    subStrokeWidth: 5,
    subFont: F.mplusRounded,
    accentBg: "#f97316",
    accentText: "#ffffff",
    accentFont: F.pottaOne,
    darkOverlay: "#7c2d12",
    darkOverlayText: "#fde047",
    stampStops: [
      { offset: 0, color: "#fef3c7" },
      { offset: 0.5, color: "#f97316" },
      { offset: 1, color: "#7c2d12" },
    ],
    swatch: ["#f97316", "#fde047", "#7c2d12"],
  },
];

// ─── Layouts (spatial arrangement) ────────────────────────────
type Layout = {
  id: string;
  label: string;
  tag: TemplateCategory;
  desc: string;
  build: (theme: Theme, ctx: TemplateContext) => EditorElement[];
};

const LAYOUTS: Layout[] = [
  // 1. centered-hero
  {
    id: "centered-hero",
    label: "中央ヒーロー",
    tag: "見出し",
    desc: "画面中央にインパクトのある大見出し。最もシンプルな王道型。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "インパクトの\n見出し";
      const sub = phrases[1] ?? "";
      const elems: EditorElement[] = [
        baseText({
          text: main,
          x: 40,
          y: H / 2 - 200,
          width: W - 80,
          fontSize: 180,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      if (sub) {
        elems.push(
          baseText({
            text: sub,
            x: 40,
            y: H - 180,
            width: W - 80,
            fontSize: 72,
            fill: t.subFill,
            stroke: t.subStroke,
            strokeWidth: t.subStrokeWidth,
            fontFamily: t.subFont,
          })
        );
      }
      return elems;
    },
  },

  // 2. bottom-bar
  {
    id: "bottom-bar",
    label: "下部ハイライト",
    tag: "見出し+強調",
    desc: "下部に色帯、上に大見出し。最もクリックされる王道レイアウト。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "インパクトの\n見出し";
      const accent = phrases[1] ?? "必見";
      return [
        baseShape({
          x: 40,
          y: H - 220,
          width: W - 80,
          height: 140,
          cornerRadius: 20,
          fill: t.accentBg,
        }),
        baseText({
          text: main,
          x: 40,
          y: 100,
          width: W - 80,
          fontSize: 160,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
        baseText({
          text: accent,
          x: 40,
          y: H - 196,
          width: W - 80,
          fontSize: 92,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
      ];
    },
  },

  // 3. top-bar
  {
    id: "top-bar",
    label: "上部ハイライト",
    tag: "見出し+強調",
    desc: "上部に色帯のタグ、メイン文字は中央寄せ。雑誌風。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "雑誌風\n見出し";
      const accent = phrases[1] ?? "特集";
      return [
        baseShape({
          x: 40,
          y: 40,
          width: W - 80,
          height: 130,
          cornerRadius: 14,
          fill: t.accentBg,
        }),
        baseText({
          text: accent,
          x: 40,
          y: 56,
          width: W - 80,
          fontSize: 80,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
        baseText({
          text: main,
          x: 40,
          y: H / 2 - 80,
          width: W - 80,
          fontSize: 160,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
    },
  },

  // 4. corner-ribbon
  {
    id: "corner-ribbon",
    label: "左上リボン",
    tag: "見出し+強調",
    desc: "左上に傾けたリボン+中央大見出し。速報・発表系。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "衝撃の\n結果";
      const accent = phrases[1] ?? "速報";
      return [
        baseShape({
          x: -20,
          y: 40,
          width: 360,
          height: 90,
          cornerRadius: 0,
          fill: t.accentBg,
          rotation: -6,
        }),
        baseText({
          text: accent,
          x: -20,
          y: 54,
          width: 360,
          rotation: -6,
          fontSize: 60,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
        baseText({
          text: main,
          x: 60,
          y: H / 2 - 160,
          width: W - 120,
          fontSize: 170,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
    },
  },

  // 5. circle-stamp
  {
    id: "circle-stamp",
    label: "円スタンプ",
    tag: "ランキング",
    desc: "右側に大きな円スタンプ+左に見出し。ランキング・表彰系。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "堂々\n1位";
      const stamp = phrases[1] ?? "1位";
      const sub = phrases[2] ?? "";
      const elems: EditorElement[] = [
        baseShape({
          x: W - 380,
          y: H / 2 - 180,
          width: 360,
          height: 360,
          shape: "ellipse",
          fill: t.accentBg,
          gradient: {
            enabled: true,
            type: "radial",
            angle: 0,
            stops: t.stampStops,
          },
          shadowBlur: 30,
          shadowOpacity: 0.5,
        }),
        baseText({
          text: stamp,
          x: W - 380,
          y: H / 2 - 140,
          width: 360,
          fontSize: 210,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
          lineHeight: 1,
        }),
        baseText({
          text: main,
          x: 60,
          y: H / 2 - 140,
          width: W - 480,
          align: "left",
          fontSize: 140,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      if (sub) {
        elems.push(
          baseText({
            text: sub,
            x: 60,
            y: H / 2 + 100,
            width: W - 480,
            align: "left",
            fontSize: 64,
            fill: t.subFill,
            stroke: t.subStroke,
            strokeWidth: t.subStrokeWidth,
            fontFamily: t.subFont,
          })
        );
      }
      return elems;
    },
  },

  // 6. giant-number
  {
    id: "giant-number",
    label: "巨大数字",
    tag: "格安訴求",
    desc: "巨大な数字+右側に説明。価格・数値訴求向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const big = phrases[0] ?? "22%\nOFF";
      const sub = phrases[1] ?? "期間限定";
      const label = phrases[2] ?? "セール";
      return [
        baseShape({
          x: -40,
          y: 60,
          width: 240,
          height: 110,
          cornerRadius: 14,
          fill: t.accentBg,
          rotation: -6,
        }),
        baseText({
          text: label,
          x: -40,
          y: 78,
          width: 240,
          rotation: -6,
          fontSize: 64,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
        baseText({
          text: big,
          x: 40,
          y: H / 2 - 260,
          width: W / 2 + 80,
          align: "left",
          fontSize: 280,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
          lineHeight: 0.95,
        }),
        baseText({
          text: sub,
          x: W / 2 + 80,
          y: H / 2 - 60,
          width: W / 2 - 140,
          align: "left",
          fontSize: 88,
          fill: t.subFill,
          stroke: t.subStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }),
      ];
    },
  },

  // 7. split-compare
  {
    id: "split-compare",
    label: "左右比較",
    tag: "比較",
    desc: "左右に対比、中央に矢印+下に見出し。ビフォアフ・検証向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const left = phrases[0] ?? "Before";
      const right = phrases[1] ?? "After";
      const main = phrases[2] ?? "こんなに\n変わる";
      return [
        baseShape({
          x: 0,
          y: 0,
          width: W / 2,
          height: H,
          cornerRadius: 0,
          fill: t.darkOverlay,
          opacity: 0.55,
          shadowEnabled: false,
        }),
        baseShape({
          x: W / 2 - 80,
          y: H / 2 - 80,
          width: 160,
          height: 160,
          shape: "ellipse",
          fill: t.accentBg,
        }),
        baseText({
          text: "→",
          x: W / 2 - 80,
          y: H / 2 - 60,
          width: 160,
          fontSize: 110,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
        baseText({
          text: left,
          x: 60,
          y: 80,
          width: W / 2 - 120,
          align: "left",
          fontSize: 84,
          fill: t.darkOverlayText,
          stroke: t.subStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }),
        baseText({
          text: right,
          x: W / 2 + 60,
          y: 80,
          width: W / 2 - 120,
          align: "left",
          fontSize: 84,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }),
        baseText({
          text: main,
          x: 40,
          y: H - 260,
          width: W - 80,
          fontSize: 128,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
    },
  },

  // 8. feature-3pill
  {
    id: "feature-3pill",
    label: "3特徴リスト",
    tag: "リスト",
    desc: "上部に見出し、下に3つの特徴ピル。レビュー・紹介向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const head = phrases[0] ?? "見どころ\n3選";
      const items = [
        phrases[1] ?? "特徴1",
        phrases[2] ?? "特徴2",
        phrases[3] ?? "特徴3",
      ];
      const pillW = 340;
      const pillH = 120;
      const gap = (W - pillW * 3) / 4;
      const elems: EditorElement[] = [
        baseText({
          text: head,
          x: 40,
          y: 60,
          width: W - 80,
          fontSize: 140,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
          lineHeight: 1,
        }),
      ];
      items.forEach((txt, i) => {
        const x = gap + (pillW + gap) * i;
        const y = H - 190;
        elems.push(
          baseShape({
            x,
            y,
            width: pillW,
            height: pillH,
            cornerRadius: pillH / 2,
            fill: t.accentBg,
          })
        );
        elems.push(
          baseText({
            text: txt,
            x,
            y: y + 22,
            width: pillW,
            fontSize: 56,
            fill: t.accentText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.accentFont,
          })
        );
      });
      return elems;
    },
  },

  // 9. speech-bubble
  {
    id: "speech-bubble",
    label: "吹き出し",
    tag: "見出し",
    desc: "大きな角丸バブル+文字。やわらかい印象で会話・疑問系に。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "これが\n正解！";
      const sub = phrases[1] ?? "";
      const bW = W - 160;
      const bH = 480;
      const bX = 80;
      const bY = H / 2 - bH / 2;
      const elems: EditorElement[] = [
        baseShape({
          x: bX,
          y: bY,
          width: bW,
          height: bH,
          cornerRadius: 60,
          fill: t.accentBg,
        }),
        // bubble tail
        baseShape({
          x: 180,
          y: bY + bH - 10,
          width: 80,
          height: 80,
          cornerRadius: 10,
          fill: t.accentBg,
          rotation: 20,
          shadowEnabled: false,
        }),
        baseText({
          text: main,
          x: bX + 40,
          y: bY + 80,
          width: bW - 80,
          fontSize: 180,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      if (sub) {
        elems.push(
          baseText({
            text: sub,
            x: bX + 40,
            y: bY + bH - 110,
            width: bW - 80,
            fontSize: 56,
            fill: t.accentText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.subFont,
          })
        );
      }
      return elems;
    },
  },

  // 10. overlay-dark
  {
    id: "overlay-dark",
    label: "下部解説バー",
    tag: "解説",
    desc: "大見出し+下部に暗い帯+補足+タグ。チュートリアル・解説向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "完全\n解説";
      const sub = phrases[1] ?? "5分でわかる";
      const tag = phrases[2] ?? "入門";
      return [
        baseShape({
          x: 0,
          y: H - 160,
          width: W,
          height: 160,
          cornerRadius: 0,
          fill: t.darkOverlay,
          opacity: 0.88,
          shadowEnabled: false,
        }),
        baseText({
          text: main,
          x: 40,
          y: 80,
          width: W - 80,
          fontSize: 200,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
        baseText({
          text: sub,
          x: 60,
          y: H - 128,
          width: W - 400,
          align: "left",
          fontSize: 64,
          fill: t.darkOverlayText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.subFont,
        }),
        baseShape({
          x: W - 280,
          y: H - 128,
          width: 220,
          height: 96,
          cornerRadius: 12,
          fill: t.accentBg,
        }),
        baseText({
          text: tag,
          x: W - 280,
          y: H - 114,
          width: 220,
          fontSize: 56,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }),
      ];
    },
  },

  // 11. stacked-cards
  {
    id: "stacked-cards",
    label: "積層カード",
    tag: "リスト",
    desc: "見出しの下に5枚までの情報カードを重ねる。要点列挙に強い。",
    build: (t, { canvasWidth: W, phrases = [] }) => {
      const main = phrases[0] ?? "要点\n5枚まとめ";
      const items = [
        phrases[1] ?? "ポイント1",
        phrases[2] ?? "ポイント2",
        phrases[3] ?? "ポイント3",
        phrases[4] ?? "ポイント4",
        phrases[5] ?? "ポイント5",
      ];
      const elems: EditorElement[] = [
        baseText({
          text: main,
          x: 60,
          y: 44,
          width: W - 120,
          fontSize: 132,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      items.forEach((item, index) => {
        const x = 90 + index * 38;
        const y = 240 + index * 58;
        elems.push(
          baseShape({
            x,
            y,
            width: W - 180 - index * 14,
            height: 86,
            cornerRadius: 22,
            fill: index % 2 === 0 ? t.accentBg : t.darkOverlay,
            opacity: 0.96,
          })
        );
        elems.push(
          baseText({
            text: item,
            x: x + 26,
            y: y + 18,
            width: W - 232 - index * 14,
            align: "left",
            fontSize: 42,
            fill: index % 2 === 0 ? t.accentText : t.darkOverlayText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.subFont,
          })
        );
      });
      return elems;
    },
  },

  // 12. six-chip-grid
  {
    id: "six-chip-grid",
    label: "6チップグリッド",
    tag: "リスト",
    desc: "大見出しと2列のチップ群。6フレーズ前後をそのまま整理しやすい。",
    build: (t, { canvasWidth: W, phrases = [] }) => {
      const main = phrases[0] ?? "6つの\n推しポイント";
      const chips = [
        phrases[1] ?? "特徴1",
        phrases[2] ?? "特徴2",
        phrases[3] ?? "特徴3",
        phrases[4] ?? "特徴4",
        phrases[5] ?? "特徴5",
      ];
      const elems: EditorElement[] = [
        baseText({
          text: main,
          x: 50,
          y: 48,
          width: W - 100,
          fontSize: 144,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      chips.forEach((chip, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 90 + col * 560;
        const y = 280 + row * 116;
        elems.push(
          baseShape({
            x,
            y,
            width: 540,
            height: 86,
            cornerRadius: 999,
            fill: row === 1 ? t.darkOverlay : t.accentBg,
          })
        );
        elems.push(
          baseText({
            text: chip,
            x: x + 22,
            y: y + 18,
            width: 496,
            fontSize: 38,
            fill: row === 1 ? t.darkOverlayText : t.accentText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.accentFont,
          })
        );
      });
      return elems;
    },
  },

  // 13. left-steps
  {
    id: "left-steps",
    label: "左帯ステップ",
    tag: "解説",
    desc: "左の帯と4段ステップで整理。手順・比較メモ向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "手順を\n最短で理解";
      const steps = [
        phrases[1] ?? "STEP 1",
        phrases[2] ?? "STEP 2",
        phrases[3] ?? "STEP 3",
        phrases[4] ?? "STEP 4",
      ];
      const tag = phrases[5] ?? "保存版";
      const elems: EditorElement[] = [
        baseShape({ x: 0, y: 0, width: 180, height: H, cornerRadius: 0, fill: t.accentBg, shadowEnabled: false }),
        baseText({
          text: tag,
          x: 0,
          y: 52,
          width: 180,
          fontSize: 44,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          rotation: -90,
          fontFamily: t.accentFont,
        }),
        baseText({
          text: main,
          x: 220,
          y: 52,
          width: W - 280,
          align: "left",
          fontSize: 120,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      steps.forEach((step, index) => {
        const y = 250 + index * 104;
        elems.push(
          baseShape({
            x: 240,
            y,
            width: W - 300,
            height: 76,
            cornerRadius: 18,
            fill: index % 2 === 0 ? t.darkOverlay : t.accentBg,
          })
        );
        elems.push(
          baseText({
            text: `${index + 1}. ${step}`,
            x: 266,
            y: y + 16,
            width: W - 352,
            align: "left",
            fontSize: 38,
            fill: index % 2 === 0 ? t.darkOverlayText : t.accentText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.subFont,
          })
        );
      });
      return elems;
    },
  },

  // 14. checklist-box
  {
    id: "checklist-box",
    label: "チェックリスト箱",
    tag: "解説",
    desc: "大枠ボックス内に5項目を整理。まとめ・要約に使いやすい。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "ここだけ\nチェック";
      const items = [
        phrases[1] ?? "確認1",
        phrases[2] ?? "確認2",
        phrases[3] ?? "確認3",
        phrases[4] ?? "確認4",
        phrases[5] ?? "確認5",
      ];
      const elems: EditorElement[] = [
        baseShape({
          x: 70,
          y: 80,
          width: W - 140,
          height: H - 150,
          cornerRadius: 42,
          fill: t.darkOverlay,
          stroke: t.accentBg,
          strokeWidth: 6,
          shadowBlur: 28,
        }),
        baseText({
          text: main,
          x: 120,
          y: 120,
          width: W - 240,
          fontSize: 124,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      items.forEach((item, index) => {
        const y = 300 + index * 70;
        elems.push(
          baseShape({
            x: 130,
            y,
            width: 34,
            height: 34,
            cornerRadius: 10,
            fill: t.accentBg,
            shadowEnabled: false,
          })
        );
        elems.push(
          baseText({
            text: item,
            x: 186,
            y: y - 2,
            width: W - 330,
            align: "left",
            fontSize: 36,
            fill: t.darkOverlayText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.subFont,
          })
        );
      });
      return elems;
    },
  },

  // 15. side-pill-tower
  {
    id: "side-pill-tower",
    label: "右ピル縦積み",
    tag: "見出し+強調",
    desc: "左に大見出し、右に情報ピルを縦積み。レビュー・紹介向け。",
    build: (t, { canvasWidth: W, phrases = [] }) => {
      const main = phrases[0] ?? "レビューで\n見るべき点";
      const sub = phrases[1] ?? "結論先出し";
      const pills = [phrases[2] ?? "音質", phrases[3] ?? "装着感", phrases[4] ?? "価格", phrases[5] ?? "総評"];
      const elems: EditorElement[] = [
        baseText({
          text: main,
          x: 60,
          y: 120,
          width: 600,
          align: "left",
          fontSize: 154,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
        baseText({
          text: sub,
          x: 60,
          y: 420,
          width: 560,
          align: "left",
          fontSize: 56,
          fill: t.subFill,
          stroke: t.subStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }),
      ];
      pills.forEach((pill, index) => {
        const y = 120 + index * 118;
        elems.push(
          baseShape({
            x: W - 420,
            y,
            width: 320,
            height: 82,
            cornerRadius: 999,
            fill: index % 2 === 0 ? t.accentBg : t.darkOverlay,
          })
        );
        elems.push(
          baseText({
            text: pill,
            x: W - 404,
            y: y + 16,
            width: 288,
            fontSize: 36,
            fill: index % 2 === 0 ? t.accentText : t.darkOverlayText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.accentFont,
          })
        );
      });
      return elems;
    },
  },

  // 16. bottom-ticket-row
  {
    id: "bottom-ticket-row",
    label: "下部チケット列",
    tag: "格安訴求",
    desc: "上に大見出し、下に4枚までのチケット。特典・比較・価格訴求向け。",
    build: (t, { canvasWidth: W, canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "特典を\n一気見せ";
      const sub = phrases[1] ?? "今だけ注目";
      const tickets = [phrases[2] ?? "値引き", phrases[3] ?? "特典", phrases[4] ?? "期間", phrases[5] ?? "注意点"];
      const elems: EditorElement[] = [
        baseText({
          text: main,
          x: 40,
          y: 58,
          width: W - 80,
          fontSize: 160,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
        baseText({
          text: sub,
          x: 60,
          y: 300,
          width: W - 120,
          fontSize: 62,
          fill: t.subFill,
          stroke: t.subStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }),
      ];
      tickets.forEach((ticket, index) => {
        const x = 50 + index * 300;
        elems.push(
          baseShape({
            x,
            y: H - 200,
            width: 270,
            height: 118,
            cornerRadius: 24,
            fill: index % 2 === 0 ? t.accentBg : t.darkOverlay,
          })
        );
        elems.push(
          baseText({
            text: ticket,
            x: x + 18,
            y: H - 166,
            width: 234,
            fontSize: 34,
            fill: index % 2 === 0 ? t.accentText : t.darkOverlayText,
            stroke: "transparent",
            strokeWidth: 0,
            shadowEnabled: false,
            fontFamily: t.accentFont,
            lineHeight: 1,
          })
        );
      });
      return elems;
    },
  },

  // 17. right-check-column
  {
    id: "right-check-column",
    label: "右チェック列",
    tag: "比較",
    desc: "左に大見出し、右にチェック列。比較ポイント整理向け。",
    build: (t, { canvasHeight: H, phrases = [] }) => {
      const main = phrases[0] ?? "比較で見る\n4ポイント";
      const sub = phrases[1] ?? "最初にここを確認";
      const items = [phrases[2] ?? "性能", phrases[3] ?? "機能", phrases[4] ?? "サイズ", phrases[5] ?? "価格"];
      const elems: EditorElement[] = [
        baseShape({ x: 0, y: 0, width: 420, height: H, cornerRadius: 0, fill: t.darkOverlay, opacity: 0.78, shadowEnabled: false }),
        baseText({
          text: main,
          x: 54,
          y: 90,
          width: 310,
          align: "left",
          fontSize: 136,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
        baseText({
          text: sub,
          x: 60,
          y: 420,
          width: 300,
          align: "left",
          fontSize: 46,
          fill: t.darkOverlayText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.subFont,
        }),
      ];
      items.forEach((item, index) => {
        const y = 112 + index * 132;
        elems.push(baseShape({ x: 520, y, width: 88, height: 88, cornerRadius: 26, fill: t.accentBg }));
        elems.push(baseText({
          text: "✓",
          x: 520,
          y: y + 8,
          width: 88,
          fontSize: 52,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }));
        elems.push(baseText({
          text: item,
          x: 632,
          y: y + 16,
          width: 560,
          align: "left",
          fontSize: 44,
          fill: t.subFill,
          stroke: t.subStroke,
          strokeWidth: t.subStrokeWidth,
          fontFamily: t.subFont,
        }));
      });
      return elems;
    },
  },

  // 18. top-rank-strip
  {
    id: "top-rank-strip",
    label: "上部ランク帯",
    tag: "ランキング",
    desc: "上にランク帯、下に項目を並べる。ランキングや総合評価向け。",
    build: (t, { canvasWidth: W, phrases = [] }) => {
      const main = phrases[0] ?? "ランキング\n総まとめ";
      const labels = [phrases[1] ?? "1位", phrases[2] ?? "2位", phrases[3] ?? "3位", phrases[4] ?? "注目", phrases[5] ?? "穴場"];
      const elems: EditorElement[] = [
        baseShape({ x: 0, y: 0, width: W, height: 150, cornerRadius: 0, fill: t.accentBg, shadowEnabled: false }),
        baseText({
          text: main,
          x: 50,
          y: 190,
          width: W - 100,
          fontSize: 158,
          fill: t.mainFill,
          stroke: t.mainStroke,
          strokeWidth: t.mainStrokeWidth,
          fontFamily: t.mainFont,
        }),
      ];
      labels.forEach((label, index) => {
        const x = 44 + index * 240;
        elems.push(baseText({
          text: label,
          x,
          y: 38,
          width: 200,
          fontSize: 42,
          fill: t.accentText,
          stroke: "transparent",
          strokeWidth: 0,
          shadowEnabled: false,
          fontFamily: t.accentFont,
        }));
      });
      return elems;
    },
  },
];

// ─── Cross-product: (theme × layout) → TemplateDef ────────────
export const TEMPLATES: TemplateDef[] = (() => {
  const list: TemplateDef[] = [];
  for (const theme of THEMES) {
    for (const layout of LAYOUTS) {
      list.push({
        id: `${theme.id}__${layout.id}`,
        name: `${theme.label} / ${layout.label}`,
        desc: layout.desc,
        tag: layout.tag,
        themeId: theme.id,
        themeLabel: theme.label,
        layoutId: layout.id,
        layoutLabel: layout.label,
        swatch: theme.swatch,
        build: (ctx) => withIds(layout.build(theme, ctx), ctx.uid),
      });
    }
  }
  return list;
})();

/**
 * One representative template per layout (uses the first theme).
 * Useful for compact UI where showing all 100 would overwhelm — e.g. the
 * Auto-generate panel's "apply to template" buttons.
 */
export const DEFAULT_TEMPLATES_PER_LAYOUT: TemplateDef[] = (() => {
  const seen = new Set<string>();
  return TEMPLATES.filter((t) => {
    if (seen.has(t.layoutId)) return false;
    seen.add(t.layoutId);
    return true;
  });
})();

/** Small metadata list of themes — for UI theme-filter controls */
export const THEME_META = THEMES.map((t) => ({
  id: t.id,
  label: t.label,
  swatch: t.swatch,
}));

/** Small metadata list of layouts — for UI layout-filter / grouping controls */
export const LAYOUT_META = LAYOUTS.map((l) => ({
  id: l.id,
  label: l.label,
  tag: l.tag,
  desc: l.desc,
}));

export function findTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
