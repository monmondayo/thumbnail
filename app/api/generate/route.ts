import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  product: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("").optional()),
  style: z.string().max(50).optional(),
  /** "simple" = 1 headline (legacy). "research" = multi-phrase research mode */
  mode: z.enum(["simple", "research"]).optional(),
});

// Legacy single-headline schema (kept for backward compat)
const SimpleSchema = z.object({
  mainText: z.string().min(1).max(20).describe("15文字以内のインパクトある日本語メインコピー"),
  subText: z.string().max(30).optional().describe("20文字以内のサブテキスト"),
  accentText: z.string().max(20).optional().describe("コーナー用の短いアクセント"),
});

// Rich research schema — used by the new AI auto mode
const ResearchSchema = z.object({
  headline: z
    .string()
    .min(1)
    .max(20)
    .describe("最もクリック率が高そうな15文字以内のメインコピー。最大2行(\\n)可"),
  subHeadline: z
    .string()
    .max(30)
    .optional()
    .describe("補足の一言。不要なら空文字"),
  features: z
    .array(z.string().min(1).max(12))
    .min(3)
    .max(6)
    .describe("商品の代表的な特徴・機能を単語〜短文で。各10文字以内。3〜6個"),
  stats: z
    .array(z.string().min(1).max(14))
    .max(4)
    .describe("具体的な数字・比較が伝わる短文(例: 「22%OFF」「10時間連続再生」)。0〜4個"),
  verdicts: z
    .array(z.string().min(1).max(16))
    .max(3)
    .describe("視聴者向けの短い評価・結論(例: 「買って損なし」「実測で判明」)。0〜3個"),
  accent: z
    .string()
    .max(14)
    .optional()
    .describe("コーナー配置用の超短いタグ(例:「新発売」「衝撃」)"),
  /** Category hint that helps the client pick a template */
  category: z
    .enum(["review", "compare", "howto", "ranking", "news", "explainer", "sale"])
    .describe("動画のカテゴリ推定"),
});

async function fetchReference(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Thumbmaker/1.0; +https://vercel.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
    const desc =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ??
      "";
    const h1s = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    const h2s = Array.from(html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .slice(0, 10);
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);
    return [
      title && `タイトル: ${title}`,
      desc && `ディスクリプション: ${desc}`,
      h1s.length && `見出し(H1): ${h1s.join(" | ")}`,
      h2s.length && `見出し(H2): ${h2s.join(" | ")}`,
      `本文抜粋: ${text}`,
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { product, url, style, mode = "research" } = parsed;
  const context = url ? await fetchReference(url) : "";

  if (mode === "simple") {
    const prompt = buildSimplePrompt(product, style, context);
    try {
      const { object } = await generateObject({
        model: "anthropic/claude-haiku-4-5",
        schema: SimpleSchema,
        prompt,
        temperature: 0.8,
      });
      return NextResponse.json({ mode: "simple", ...object });
    } catch (err) {
      return errorResponse(err);
    }
  }

  // research mode (default)
  const prompt = buildResearchPrompt(product, style, context);
  try {
    const { object } = await generateObject({
      // Sonnet produces more accurate, less generic feature phrasing than Haiku.
      model: "anthropic/claude-sonnet-4-5",
      schema: ResearchSchema,
      prompt,
      temperature: 0.7,
    });
    return NextResponse.json({ mode: "research", ...object });
  } catch (err) {
    return errorResponse(err);
  }
}

function buildSimplePrompt(product: string, style: string | undefined, context: string) {
  return `あなたはYouTubeサムネイル専門コピーライターです。
視聴者が思わずクリックしたくなる短く強い日本語コピーを生成してください。

【動画テーマ/商品名】
${product}

【スタイル】
${style ?? "インパクト重視"}

${context ? `【参考サイト情報】\n${context}\n` : ""}

ルール:
- メインテキストは必ず15文字以内。最大2行で改行は"\\n"使用可。
- 具体的な数字や強い言葉を活用。
- 絵文字禁止。`;
}

function buildResearchPrompt(
  product: string,
  style: string | undefined,
  context: string
) {
  return `あなたはYouTubeサムネイル専門のリサーチャー兼コピーライターです。
指定された商品/テーマについて、以下の知識を総動員してリサーチし、サムネイル上に実際に配置する短いテキスト群を生成してください。

【商品 / 動画テーマ】
${product}

【希望スタイル】
${style ?? "インパクト重視"}

${context ? `【参考サイトから抽出した情報】\n${context}\n` : "【参考情報】提供なし。あなたの学習知識で代表的な機能・特徴を推定してください。"}

===== 出力する項目 =====
1. headline: 最もインパクトある見出し(必ず15文字以内、2行可)
2. subHeadline: 補足1行(20文字以内、不要なら省略)
3. features: その商品/テーマの代表的な"特徴・機能・売り"を単語〜短文で3〜6個
   - 各10文字以内
   - 具体的なスペック・独自機能を優先(例: 「ノイキャン強化」「40時間再生」)
4. stats: 数字を含む具体的な事実(例: 「最大40時間」「価格22%OFF」「3年保証」)
   - 参考情報や一般知識から事実ベースで。0〜4個。わからなければ省略。
5. verdicts: 視聴者に刺さる"評価・結論"型の短文(例: 「買って損なし」「コスパ最強」)
   - 0〜3個、各16文字以内
6. accent: コーナーに置く極短タグ(例: 「新発売」「衝撃」「解説」)、任意
7. category: 動画カテゴリを review / compare / howto / ranking / news / explainer / sale から1つ

===== 厳守ルール =====
- 事実に反する断定は禁止。参考情報がない場合は一般的な特徴のみ。
- 絵文字・顔文字は禁止。カギ括弧【】や「」は可。
- 抽象的なキャッチコピーより具体的な機能名・数字を優先。
- 重複や類似フレーズを避け、バラエティのある表現で。`;
}

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "生成に失敗しました";
  const hint =
    msg.includes("API key") || msg.includes("credential") || msg.includes("credit")
      ? " — AI Gatewayの設定(AI_GATEWAY_API_KEY)とクレジット状況を確認してください。"
      : "";
  return NextResponse.json({ error: msg + hint }, { status: 500 });
}
