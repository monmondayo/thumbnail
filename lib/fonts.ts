export type FontOption = {
  label: string;
  family: string;
  cssFamily: string;
  weights: number[];
  category?: "sans" | "serif" | "rounded" | "display" | "handwriting" | "pop" | "mono";
};

export const JAPANESE_FONTS: FontOption[] = [
  // ─── Sans / Universal ───────────────────────────
  { label: "Noto Sans JP (標準)", family: "Noto Sans JP", cssFamily: '"Noto Sans JP", sans-serif', weights: [400, 700, 900], category: "sans" },
  { label: "M PLUS 1p", family: "M PLUS 1p", cssFamily: '"M PLUS 1p", sans-serif', weights: [400, 700, 900], category: "sans" },
  { label: "BIZ UDPGothic (読みやすい)", family: "BIZ UDPGothic", cssFamily: '"BIZ UDPGothic", sans-serif', weights: [400, 700], category: "sans" },

  // ─── Rounded ─────────────────────────────────────
  { label: "M PLUS Rounded 1c (丸ゴ)", family: "M PLUS Rounded 1c", cssFamily: '"M PLUS Rounded 1c", sans-serif', weights: [400, 700, 900], category: "rounded" },
  { label: "Zen Maru Gothic (丸ゴ)", family: "Zen Maru Gothic", cssFamily: '"Zen Maru Gothic", sans-serif', weights: [400, 700, 900], category: "rounded" },
  { label: "Kosugi Maru (細丸ゴ)", family: "Kosugi Maru", cssFamily: '"Kosugi Maru", sans-serif', weights: [400], category: "rounded" },
  { label: "Kiwi Maru (やさしい丸ゴ)", family: "Kiwi Maru", cssFamily: '"Kiwi Maru", serif', weights: [400, 500], category: "rounded" },

  // ─── Display / インパクト ────────────────────────
  { label: "Dela Gothic One (極太)", family: "Dela Gothic One", cssFamily: '"Dela Gothic One", sans-serif', weights: [400], category: "display" },
  { label: "Reggae One (レゲエ)", family: "Reggae One", cssFamily: '"Reggae One", cursive', weights: [400], category: "display" },
  { label: "RocknRoll One", family: "RocknRoll One", cssFamily: '"RocknRoll One", sans-serif', weights: [400], category: "display" },
  { label: "Train One (レトロ看板)", family: "Train One", cssFamily: '"Train One", sans-serif', weights: [400], category: "display" },
  { label: "Potta One (極太ポップ)", family: "Potta One", cssFamily: '"Potta One", sans-serif', weights: [400], category: "display" },
  { label: "Rampart One (影付き)", family: "Rampart One", cssFamily: '"Rampart One", sans-serif', weights: [400], category: "display" },

  // ─── Pop / かわいい ──────────────────────────────
  { label: "Mochiy Pop One (もちポップ)", family: "Mochiy Pop One", cssFamily: '"Mochiy Pop One", sans-serif', weights: [400], category: "pop" },
  { label: "Hachi Maru Pop", family: "Hachi Maru Pop", cssFamily: '"Hachi Maru Pop", cursive', weights: [400], category: "pop" },
  { label: "Yomogi (手描きポップ)", family: "Yomogi", cssFamily: '"Yomogi", cursive', weights: [400], category: "pop" },

  // ─── Handwriting ─────────────────────────────────
  { label: "Yusei Magic (手書き風)", family: "Yusei Magic", cssFamily: '"Yusei Magic", sans-serif', weights: [400], category: "handwriting" },
  { label: "Klee One (鉛筆手書き)", family: "Klee One", cssFamily: '"Klee One", cursive', weights: [400, 600], category: "handwriting" },
  { label: "Zen Kurenaido (ラフ手書き)", family: "Zen Kurenaido", cssFamily: '"Zen Kurenaido", sans-serif', weights: [400], category: "handwriting" },
  { label: "Yuji Mai (筆文字)", family: "Yuji Mai", cssFamily: '"Yuji Mai", serif', weights: [400], category: "handwriting" },
  { label: "Yuji Syuku (筆・楷)", family: "Yuji Syuku", cssFamily: '"Yuji Syuku", serif', weights: [400], category: "handwriting" },

  // ─── Serif / 明朝 ────────────────────────────────
  { label: "Noto Serif JP (明朝)", family: "Noto Serif JP", cssFamily: '"Noto Serif JP", serif', weights: [400, 700, 900], category: "serif" },
  { label: "Shippori Mincho (明朝)", family: "Shippori Mincho", cssFamily: '"Shippori Mincho", serif', weights: [400, 700, 900], category: "serif" },
  { label: "Kaisei Decol (明朝)", family: "Kaisei Decol", cssFamily: '"Kaisei Decol", serif', weights: [400, 700], category: "serif" },
  { label: "Hina Mincho (繊細明朝)", family: "Hina Mincho", cssFamily: '"Hina Mincho", serif', weights: [400], category: "serif" },
  { label: "BIZ UDPMincho (読みやすい明朝)", family: "BIZ UDPMincho", cssFamily: '"BIZ UDPMincho", serif', weights: [400, 700], category: "serif" },

  // ─── Monospace / Dot ─────────────────────────────
  { label: "DotGothic16 (ドット)", family: "DotGothic16", cssFamily: '"DotGothic16", sans-serif', weights: [400], category: "mono" },
  { label: "Stick (スティック体)", family: "Stick", cssFamily: '"Stick", sans-serif', weights: [400], category: "mono" },
];

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Noto+Sans+JP:wght@400;700;900",
    "family=M+PLUS+1p:wght@400;700;900",
    "family=BIZ+UDPGothic:wght@400;700",
    "family=M+PLUS+Rounded+1c:wght@400;700;900",
    "family=Zen+Maru+Gothic:wght@400;700;900",
    "family=Kosugi+Maru",
    "family=Kiwi+Maru:wght@400;500",
    "family=Dela+Gothic+One",
    "family=Reggae+One",
    "family=RocknRoll+One",
    "family=Train+One",
    "family=Potta+One",
    "family=Rampart+One",
    "family=Mochiy+Pop+One",
    "family=Hachi+Maru+Pop",
    "family=Yomogi",
    "family=Yusei+Magic",
    "family=Klee+One:wght@400;600",
    "family=Zen+Kurenaido",
    "family=Yuji+Mai",
    "family=Yuji+Syuku",
    "family=Noto+Serif+JP:wght@400;700;900",
    "family=Shippori+Mincho:wght@400;700;900",
    "family=Kaisei+Decol:wght@400;700",
    "family=Hina+Mincho",
    "family=BIZ+UDPMincho:wght@400;700",
    "family=DotGothic16",
    "family=Stick",
    "display=swap",
  ].join("&");

export async function ensureFontsLoaded() {
  if (typeof document === "undefined") return;
  try {
    await Promise.all(
      JAPANESE_FONTS.flatMap((f) =>
        f.weights.map((w) => document.fonts.load(`${w} 32px "${f.family}"`))
      )
    );
  } catch {}
}

// ─── Gradient presets ────────────────────────────────
export type GradientPreset = {
  label: string;
  colors: string[];
  /** Build stops spread evenly across [0,1] */
  angle?: number;
};

export const GRADIENT_PRESETS: GradientPreset[] = [
  { label: "ゴールド", colors: ["#fde047", "#f59e0b", "#b45309"], angle: 90 },
  { label: "サンセット", colors: ["#fb923c", "#ef4444", "#a855f7"], angle: 135 },
  { label: "ネオンピンク", colors: ["#f472b6", "#ec4899", "#be185d"], angle: 90 },
  { label: "レッドフレイム", colors: ["#fde047", "#ef4444"], angle: 90 },
  { label: "ブルーグロー", colors: ["#60a5fa", "#2563eb", "#1e3a8a"], angle: 90 },
  { label: "シアンパープル", colors: ["#22d3ee", "#8b5cf6"], angle: 90 },
  { label: "グリーンライム", colors: ["#d9f99d", "#22c55e", "#15803d"], angle: 90 },
  { label: "シルバー", colors: ["#f4f4f5", "#a1a1aa", "#52525b"], angle: 90 },
  { label: "モノクロ", colors: ["#ffffff", "#71717a"], angle: 90 },
  { label: "レインボー", colors: ["#ef4444", "#f59e0b", "#fde047", "#22c55e", "#3b82f6", "#a855f7"], angle: 90 },
  { label: "アイス", colors: ["#e0f2fe", "#7dd3fc", "#0284c7"], angle: 135 },
  { label: "ラバ", colors: ["#fde047", "#f97316", "#7c2d12"], angle: 135 },
];

/** Derive 2–3-stop presets from a user-picked base color */
export function derivedPresetsFromBase(hex: string): GradientPreset[] {
  const base = normalizeHex(hex);
  if (!base) return [];
  const lighter = shiftLightness(base, 0.3);
  const darker = shiftLightness(base, -0.25);
  const muchDarker = shiftLightness(base, -0.5);
  const complement = rotateHue(base, 180);
  const analog1 = rotateHue(base, -30);
  const analog2 = rotateHue(base, 30);
  return [
    { label: "明→基本", colors: [lighter, base], angle: 90 },
    { label: "基本→暗", colors: [base, darker], angle: 90 },
    { label: "明→基本→暗", colors: [lighter, base, muchDarker], angle: 90 },
    { label: "類似色 (暖)", colors: [analog1, base, analog2], angle: 90 },
    { label: "補色ミックス", colors: [base, complement], angle: 135 },
    { label: "高級感", colors: [base, "#111827"], angle: 90 },
  ];
}

// ─── Color helpers ───────────────────────────────────
function normalizeHex(hex: string): string | null {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return "#" + h.toLowerCase();
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x)))
    .toString(16)
    .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

function shiftLightness(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const newL = Math.max(0, Math.min(1, l + delta));
  const [r2, g2, b2] = hslToRgb(h, s, newL);
  return rgbToHex(r2, g2, b2);
}

function rotateHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [r2, g2, b2] = hslToRgb((h + deg + 360) % 360, s, l);
  return rgbToHex(r2, g2, b2);
}
