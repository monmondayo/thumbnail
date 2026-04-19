# Thumbmaker — YouTubeサムネイル作成ツール

Canva風の編集UIで、動画の静止画キャプチャからワンクリックでYouTubeサムネイルを作れるWebアプリ。
AIオートモードで商品名と参考URLから日本語コピーを自動生成して配置もできます。

## 機能

- 背景画像アップロード（動画のキャプチャなど）
- 手動モード：テキスト追加、フォント/サイズ/色/輪郭線/影を自由に調整
- オートモード：商品名と参考サイトURLからAIが日本語コピーを自動生成して配置
- レイヤー操作：テキスト/画像レイヤーの追加・複製・並べ替え・削除・表示切替
- 日本語Googleフォント対応（Noto Sans JP, Dela Gothic One, M PLUS Rounded 1c など11書体）
- ドラッグで移動・ハンドルで拡大縮小・回転
- キャンバス内ダブルクリックでテキストをその場で編集
- Undo/Redo（Cmd+Z / Cmd+Shift+Z）
- ローカルに保存 → サムネイル付き一覧から再読み込み
- JPEG / PNG 出力（1280×720）

## 技術スタック

- Next.js 16 (App Router, Turbopack)
- TypeScript + Tailwind v4
- [Konva.js](https://konvajs.org/) + react-konva（キャンバスエディタ）
- [Vercel AI Gateway](https://vercel.com/ai-gateway) + [AI SDK v6](https://ai-sdk.dev/)（AIテキスト生成）
- localStorage（保存データ）
- Google Fonts（日本語書体）

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# AI_GATEWAY_API_KEY を設定（オートモードを使う場合）
npm run dev
```

http://localhost:3000 で開けます。

## AI Gateway の認証設定

オートモードでAIテキスト生成を使うには、次のどちらか一つで認証できます。

### 方法A: APIキー（シンプル）

1. https://vercel.com/ai-gateway にアクセス → チームを選ぶ → 「API Keys」
   - 直接リンク: https://vercel.com/d?to=%2F%5Bteam%5D%2F~%2Fai-gateway%2Fapi-keys
2. 「Create Key」で新規発行してコピー
3. `.env.local` の `AI_GATEWAY_API_KEY` に貼り付け

### 方法B: OIDCトークン（推奨、キー管理不要）

Vercelプロジェクトにリンクすれば、OIDCトークンで自動認証されます。

```bash
npm i -g vercel@latest
vercel link          # このリポジトリをVercelプロジェクトと紐付け
vercel env pull      # .env.local に OIDC トークンが自動で入る（12時間有効）
```

ローカル開発中は無料クレジットが使えます。本番ではトークンベースの従量課金（Haikuモデルは非常に安価）。

## デプロイ（Vercel）

```bash
npm i -g vercel@latest
vercel link
vercel env add AI_GATEWAY_API_KEY   # production / preview / development すべてに追加
vercel --prod
```

Hobby プランで完全無料で運用可能。AI Gateway も無料クレジット枠内で十分回せます。

## コスト最適化のポイント

- 保存データは **localStorage** に置くため DB コスト ¥0
- AI生成は **`anthropic/claude-haiku-4-5`** を使用（応答あたり ¢ サブセント）
- 画像は base64 のまま保存、Blob ストレージ不使用
- Vercel Hobby プランに収まる軽量構成

将来的にクラウド保存が必要になったら [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) に差し替え可能です。
