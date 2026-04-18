import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  product: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("").optional()),
  style: z.string().max(50).optional(),
});

const Schema = z.object({
  mainText: z
    .string()
    .min(1)
    .max(20)
    .describe("15文字以内、最大2行のインパクトある日本語メインコピー"),
  subText: z
    .string()
    .max(30)
    .optional()
    .describe("20文字以内のサブテキスト。必要なければ空文字"),
  accentText: z
    .string()
    .max(20)
    .optional()
    .describe("コーナーに置く短いアクセント（例: 新発売!, 〇〇分で解説）。任意"),
});

async function fetchReference(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Thumbmaker/1.0; +https://vercel.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const title =
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
    const desc =
      html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
      )?.[1] ??
      html.match(
        /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
      )?.[1] ??
      "";
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1800);
    return [title && `タイトル: ${title}`, desc && `説明: ${desc}`, `本文: ${text}`]
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
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { product, url, style } = parsed;
  const context = url ? await fetchReference(url) : "";

  const prompt = `あなたはYouTubeのサムネイル専門コピーライターです。
視聴者が思わずクリックしたくなる、短くて強い日本語コピーを生成してください。

【動画テーマ / 商品名】
${product}

【スタイル】
${style ?? "インパクト重視"}

${
  context
    ? `【参考サイト情報】\n${context}\n`
    : ""
}

ルール:
- メインテキストは必ず15文字以内。最大2行で改行は"\n"を使用可能。
- 視聴者が「えっ?」「知りたい!」と感じる具体的な数字や強い言葉を活用。
- 抽象的なキャッチコピーではなく、動画の価値・メリットが伝わる言葉に。
- サブテキストが不要なら空文字を返す。アクセントテキストも任意。
- 過剰な装飾や絵文字は禁止。カギカッコ【】は使用可。`;

  try {
    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4-5",
      schema: Schema,
      prompt,
      temperature: 0.8,
    });
    return NextResponse.json(object);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "生成に失敗しました";
    const hint = msg.includes("API key") || msg.includes("credential")
      ? " — AI_GATEWAY_API_KEYが設定されているか確認してください。"
      : "";
    return NextResponse.json({ error: msg + hint }, { status: 500 });
  }
}
