# Japandi Poster Auto Studio

海外向けの Japandi スタイル日本ポスターを生成・管理し、Etsy 販売用データと SNS 投稿文を作る管理システム。

リポジトリ: [duke24510studio-dotcom/Love-art.](https://github.com/duke24510studio-dotcom/Love-art.)

---

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **SQLite**
- **OpenAI API** (DALL-E 3 + GPT-4o)
- ローカル保存 `/outputs/images`

---

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

```bash
cp env.example .env
```

`.env` を編集して `OPENAI_API_KEY` を設定してください：

```
OPENAI_API_KEY=sk-...
DATABASE_URL="file:./dev.db"
OUTPUT_DIR="./outputs"
```

### 3. DB マイグレーション

```bash
npx prisma migrate dev
```

### 4. シードデータ投入（20テーマ）

```bash
npm run seed
```

### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

---

## ページ構成

| URL | 説明 |
|-----|------|
| `/` | ダッシュボード |
| `/posters` | ポスター一覧 |
| `/posters/new` | 新規テーマ登録 |
| `/posters/[id]` | 詳細・レビュー・AI生成 |

---

## ワークフロー（MVP）

```
① /posters/new でテーマ登録
② プロンプト生成（POST /api/generate/prompt）
③ 画像生成（POST /api/generate/poster）
④ Etsy + SNS コピー（POST /api/generate/copy）
⑤ /posters/[id] でレビュー → 採用 / ボツ
⑥ CSV・ZIP 出力 → Etsy に手動登録
```

---

## 公開（Railway）

手順は [DEPLOY.md](./DEPLOY.md) を参照。

---

## API

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET/POST | `/api/posters` | テーマ一覧・作成 |
| GET/PATCH/DELETE | `/api/posters/[id]` | テーマ操作 |
| POST | `/api/generations` | Generation 作成 |
| PATCH/DELETE | `/api/generations/[id]` | Generation 操作 |
| POST | `/api/generate/prompt` | プロンプト生成 |
| POST | `/api/generate/poster` | DALL-E 3 画像生成 |
| POST | `/api/generate/copy` | Etsy + SNS コピー |
| POST | `/api/export/csv` | CSV 出力 |
| POST | `/api/export/zip` | ZIP 出力 |
