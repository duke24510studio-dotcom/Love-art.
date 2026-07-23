# Rakuten Affiliate Review Studio

楽天市場の商品を**1件ずつ**登録し、5人の紹介キャラクターによる多面的なレビューを
**毎週コツコツ**積み上げていくパイプライン。一度に大量の商品を扱うのではなく、
1商品につきレビュー資産を長期間かけて育てる設計。ポスター/記事パイプラインと同じ
「自動生成するが自動公開しない・人間レビュー必須」の思想。

## ⚠️ ステマ・景品表示法ポリシー（最重要）

- 生成されるレビューは**実際の購入者の口コミではなく**、サイト運営者が用意した
  「紹介キャラクター」による紹介記事。実購入・検証済みを装う表現は禁止。
- 2023年施行のステマ規制（景品表示法）に対応し、**すべての生成本文の末尾に
  「PR」表記＋AI利用開示を必ず含める**（`REVIEW_DISCLOSURE`、`src/lib/review.ts`）。
- 存在しない仕様・効果・数値・研究結果の捏造、医療的効果の断定、
  「日本一」「絶対」等の誇大表現は生成システムプロンプトで禁止している。
- 実際の投稿（SNS・ブログへの掲載）は**人間がレビュー・承認してから手動で行う**。

## データモデル（Prisma）

- **RakutenProduct** — 追跡する楽天商品1件。`status`: `active`(生成継続) / `paused` / `archived`。
  `weekCount` が生成済みラウンド数。
- **ReviewRound** — 1週分のバッチ。`weekNumber` と、商品の元画像を編集して作った
  AIライフスタイル写真（`imagePath`）を持つ。
- **ProductReview** — ラウンド内の1紹介キャラクター分のレビュー（5件/ラウンド）。
  `persona` は固定5種（`src/lib/review-personas.ts`）:
  主婦目線 / コスパ重視 / ギフト目線 / 初心者目線 / スペック比較目線。

ステータスフロー（Round/Review共通）: `generated → review → approved / rejected → exported`。

## 生成の流れ

1. `POST /api/rakuten/lookup` — URLから商品情報をプレビュー取得（保存しない）。
2. `POST /api/products` — 商品を登録（内部で再度lookupして保存。重複URLは409）。
3. `POST /api/products/[id]/generate` — その商品の**次の週**のラウンドを生成:
   - `src/lib/review.ts`: OpenAI chat completionで5人分のレビューをJSON一括生成。
   - `src/lib/review-image.ts`: `openai.images.edit` で商品の元画像を編集し、
     自然光の生活シーン写真を1枚生成（ベストエフォート。失敗してもレビューは残る）。
   - 成功後 `RakutenProduct.weekCount` をインクリメント。
4. `/products/[id]` でレビューごとに承認/却下、コピー用テキスト取得。
5. `POST /api/export/rakuten-csv` — 承認済みレビューをCSVエクスポート。

## API ルート

| メソッド | パス | 役割 |
|----------|------|------|
| POST | `/api/rakuten/lookup` | URLから商品情報をプレビュー |
| GET/POST | `/api/products` | 商品一覧 / 登録 |
| GET/PATCH/DELETE | `/api/products/[id]` | 取得 / status変更 / 削除 |
| POST | `/api/products/[id]/generate` | 次の週のラウンドを手動生成 |
| GET/PATCH | `/api/rounds/[id]` | ラウンド取得 / 一括ステータス変更 |
| PATCH | `/api/reviews/[id]` | 個別レビューの編集・承認・却下 |
| POST | `/api/cron/rakuten-reviews` | active商品を一括で1週分ずつ進める（`CRON_SECRET`保護） |
| POST | `/api/export/rakuten-csv` | 承認済みレビューをCSVエクスポート |

## スケジューリング（週次）

`.github/workflows/rakuten-review-pipeline.yml` が毎週月曜 00:30 UTC (09:30 JST) に
`POST /api/cron/rakuten-reviews` を叩く。記事/ポスターの日次パイプラインとは異なり、
これは「1商品を長期間育てる」設計のため週次。

## 環境変数

```
RAKUTEN_APP_ID=       # https://webservice.rakuten.co.jp/ で取得（商品検索に必須）
RAKUTEN_AFFILIATE_ID= # 楽天アフィリエイトの自分のID（アフィリエイトリンク生成用）
OPENAI_API_KEY=       # 既存。レビュー文・画像生成に使用
CRON_SECRET=          # /api/cron/rakuten-reviews 保護用のランダム文字列（記事/ポスターと共用可）
RAKUTEN_REVIEW_MODEL= # 任意。既定 gpt-4o
RAKUTEN_IMAGE_MODEL=  # 任意。既定 gpt-image-1
```

## 今後のTODO（MVP外）

- ラウンド単位の一括承認/却下UI（現状はレビュー個別、ラウンドAPIは対応済み）
- 商品ごとの週次生成の自動一時停止（在庫切れ・値上げ検知など）
- ZIPエクスポート（レビュー本文＋ライフスタイル写真をまとめて）
