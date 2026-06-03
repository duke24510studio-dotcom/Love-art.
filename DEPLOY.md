# Render で公開（3ステップ）

リポジトリ: [duke24510studio-dotcom/Love-art.](https://github.com/duke24510studio-dotcom/Love-art.)

## ステップ 1 — このボタンを押す

**[▶ Render でデプロイ](https://render.com/deploy?repo=https://github.com/duke24510studio-dotcom/Love-art.)**

## ステップ 2 — GitHub 連携

- Render に GitHub を接続
- リポジトリ `Love-art.` を選ぶ
- **Apply** をクリック

## ステップ 3 — OpenAI キー

- 環境変数 **`OPENAI_API_KEY`** にあなたのキーを入力
- デプロイ完了を待つ（5〜10分）

完了後、表示された URL（例: `https://japandi-poster-studio.onrender.com`）を開く。

- 初回起動時に **20テーマが自動投入** されます
- `/posters` → テーマを開く → **① Prompt → ② Image → ③ Etsy + SNS**

---

## ローカル開発

```bash
docker compose up -d
cp env.example .env
# OPENAI_API_KEY を .env に設定
npm install
npx prisma migrate dev
npm run seed
npm run dev
```
