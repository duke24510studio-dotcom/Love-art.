# 公開手順（GitHub + Railway）

このアプリは SQLite とローカル画像保存を使うため、**Vercel ではなく Railway（Docker）** での公開を推奨します。

## 1. GitHub にプッシュ

リポジトリ URL が `https://github.com/YOUR_USER/japandi-poster-auto-studio` の場合:

```powershell
cd c:\Users\satos\japandi-poster-auto-studio
git remote add origin https://github.com/YOUR_USER/japandi-poster-auto-studio.git
git add -A
git commit -m "feat: AI generation APIs and Railway deploy config"
git push -u origin master
```

※ すでに `origin` がある場合は `git remote set-url origin ...` を使ってください。

## 2. Railway でデプロイ

1. [Railway](https://railway.com/) にログイン
2. **New Project** → **Deploy from GitHub repo** → このリポジトリを選択
3. **Settings** → **Volumes** → マウントパス `/data` のボリュームを追加
4. **Variables** に以下を設定:

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | OpenAI の API キー |
| `DATABASE_URL` | `file:/data/dev.db` |
| `OUTPUT_DIR` | `/data/outputs` |
| `NODE_ENV` | `production` |

5. デプロイ完了後、表示された URL を開く

## 3. 初回のみシード（任意）

Railway の **Service** → **Shell** またはローカルで DB がある場合:

```bash
npm run seed
```

## 4. 使い方

1. 公開 URL を開く
2. `/posters` → テーマを選択
3. 詳細画面で **① Prompt** → **② Image** → **③ Etsy + SNS**
4. 承認後 **Export** で CSV / ZIP

## ローカル開発

```bash
cp env.example .env
# OPENAI_API_KEY を設定
npm install
npx prisma migrate dev
npm run seed
npm run dev
```
