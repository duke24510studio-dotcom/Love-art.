# 公開手順

リポジトリ: [duke24510studio-dotcom/Love-art.](https://github.com/duke24510studio-dotcom/Love-art.)

**Vercel / GitHub Pages では動きません**（SQLite + ローカル画像のため）。  
**Render** または **Railway**（Docker）を使ってください。

---

## 方法 A: Render（推奨・約5分）

1. [Render Dashboard](https://dashboard.render.com/) にログイン
2. **New** → **Blueprint**
3. GitHub で `Love-art.` リポジトリを接続
4. `render.yaml` が読み込まれる → **Apply**
5. 環境変数 `OPENAI_API_KEY` を入力（Secret）
6. デプロイ完了後、表示された URL を開く
7. 初回のみ Shell で: `npm run seed`（20テーマ投入）

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/duke24510studio-dotcom/Love-art.)

---

## 方法 B: Railway

1. [Railway](https://railway.com/) → **New Project** → **Deploy from GitHub** → `Love-art.`
2. **Volumes** → マウント `/data`
3. Variables:

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | OpenAI API キー |
| `DATABASE_URL` | `file:/data/dev.db` |
| `OUTPUT_DIR` | `/data/outputs` |

4. デプロイ後 URL を開く

---

## 使い方

1. `/posters` → テーマを開く
2. **① Prompt** → **② Image** → **③ Etsy + SNS**
3. 承認 → Export CSV/ZIP

---

## ローカル開発

```bash
cp env.example .env
npm install
npm rebuild better-sqlite3
npx prisma migrate dev
npm run seed
npm run dev
```

Node **22** 推奨（`node -v` で確認）。
