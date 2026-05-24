# Japandi Poster Auto Studio

海外向けの Japandi スタイル日本ポスターを生成・管理し、Etsy 販売用データと SNS 投稿文を作る管理システム。

---

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **SQLite**
- **OpenAI API** (画像生成・テキスト生成 — TODO)
- ローカル保存 `/outputs/images`

---

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

```bash
cp .env.example .env
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
| `/posters/[id]` | 詳細・レビュー画面 |

---

## npm スクリプト

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run seed       # 20テーマをDBに投入
npm run db:push    # Prisma マイグレーション
npm run db:studio  # Prisma Studio（DB GUI）
```

---

## ステータス

```
idea → prompted → generated → review → approved → exported
                                      ↘ rejected
```

---

## ワークフロー（MVP）

```
① /posters/new でテーマ登録
② プロンプト生成（TODO）
③ 画像生成（TODO: DALL-E 3）
④ Etsy コピー生成（TODO: GPT-4o）
⑤ SNS コピー生成（Instagram / Pinterest / X）
⑥ /posters/[id] でレビュー
⑦ 採用 / ボツ
⑧ CSV・ZIP 出力 → Etsy に手動登録
```

---

## API

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET/POST | `/api/posters` | テーマ一覧・作成 |
| GET/PATCH/DELETE | `/api/posters/[id]` | テーマ操作 |
| POST | `/api/generations` | Generation 作成 |
| PATCH/DELETE | `/api/generations/[id]` | Generation 操作 |
| POST | `/api/export/csv` | CSV 出力 |
| POST | `/api/export/zip` | ZIP 出力 |

---

## TODO（MVP 以降）

- [ ] `POST /api/generate/prompt` — プロンプト生成
- [ ] `POST /api/generate/poster` — DALL-E 3 画像生成
- [ ] `POST /api/generate/copy` — Etsy + SNS コピー生成（GPT-4o）
- [ ] Etsy API 連携
- [ ] Pinterest / Instagram 自動投稿
- [ ] バッチ生成（1日10作品）
