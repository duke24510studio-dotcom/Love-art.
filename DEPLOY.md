# 公開手順（GitHub + Railway）

このアプリは SQLite とローカル画像保存を使うため、**Vercel ではなく Railway（Docker）** での公開を推奨します。

## 1. GitHub にプッシュ

リポジトリ: [duke24510studio-dotcom/Love-art.](https://github.com/duke24510studio-dotcom/Love-art.)

```powershell
cd c:\Users\satos\japandi-poster-auto-studio
git push -u origin master
```

※ `duke24510studio-dotcom` アカウントで push してください。

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
