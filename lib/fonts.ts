export type FontOption = {
  label: string;
  family: string;
  cssFamily: string;
  weights: number[];
};

export const JAPANESE_FONTS: FontOption[] = [
  { label: "Noto Sans JP (標準)", family: "Noto Sans JP", cssFamily: '"Noto Sans JP", sans-serif', weights: [400, 700, 900] },
  { label: "M PLUS 1p", family: "M PLUS 1p", cssFamily: '"M PLUS 1p", sans-serif', weights: [400, 700, 900] },
  { label: "M PLUS Rounded 1c (丸ゴシック)", family: "M PLUS Rounded 1c", cssFamily: '"M PLUS Rounded 1c", sans-serif', weights: [400, 700, 900] },
  { label: "Dela Gothic One (極太)", family: "Dela Gothic One", cssFamily: '"Dela Gothic One", sans-serif', weights: [400] },
  { label: "Reggae One (ポップ)", family: "Reggae One", cssFamily: '"Reggae One", cursive', weights: [400] },
  { label: "RocknRoll One", family: "RocknRoll One", cssFamily: '"RocknRoll One", sans-serif', weights: [400] },
  { label: "Yusei Magic (手書き風)", family: "Yusei Magic", cssFamily: '"Yusei Magic", sans-serif', weights: [400] },
  { label: "Kaisei Decol (明朝)", family: "Kaisei Decol", cssFamily: '"Kaisei Decol", serif', weights: [400, 700] },
  { label: "Shippori Mincho (明朝)", family: "Shippori Mincho", cssFamily: '"Shippori Mincho", serif', weights: [400, 700, 900] },
  { label: "Zen Maru Gothic (丸ゴ)", family: "Zen Maru Gothic", cssFamily: '"Zen Maru Gothic", sans-serif', weights: [400, 700, 900] },
  { label: "Yuji Mai (筆文字)", family: "Yuji Mai", cssFamily: '"Yuji Mai", serif', weights: [400] },
];

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Noto+Sans+JP:wght@400;700;900",
    "family=M+PLUS+1p:wght@400;700;900",
    "family=M+PLUS+Rounded+1c:wght@400;700;900",
    "family=Dela+Gothic+One",
    "family=Reggae+One",
    "family=RocknRoll+One",
    "family=Yusei+Magic",
    "family=Kaisei+Decol:wght@400;700",
    "family=Shippori+Mincho:wght@400;700;900",
    "family=Zen+Maru+Gothic:wght@400;700;900",
    "family=Yuji+Mai",
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
