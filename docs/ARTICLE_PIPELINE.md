# Article Pipeline — Medium ⇔ note 自動記事スタジオ

Medium と note のトレンドを **着想（インスピレーション）** として収集し、OpenAI で
**完全オリジナル記事の下書き** を自動生成するパイプライン。ポスターMVPと同じ
「自動生成するが自動公開しない・人間レビュー必須」の思想で設計する。

## ⚠️ 著作権・利用規約ポリシー（最重要）

- 他人の記事を **丸ごと翻訳して転載する行為は著作権侵害**（翻訳＝二次的著作物の作成）であり、
  Medium / note 双方の利用規約にも違反する。**このパイプラインは転載を一切行わない。**
- 収集した外部記事は **トレンド把握・着想のためだけ** に使い、本文はコピーしない。
- 生成物は必ず **オリジナルの分析・構成・文章**。元記事に触れる場合は要約せず、
  一般的なテーマとして扱う（特定記事の再現をしない）。
- 生成本文の末尾に AI 開示文を付与する。
- 実際の投稿（Medium / note への公開）は **人間がレビュー・承認してから手動で行う**。
  note には公式投稿APIが無く、Medium の投稿APIも新規発行停止中のため、MVPでは自動公開しない。

## パイプラインのチャンネル(direction)

`direction` は「出力チャンネル(発信ブランド)」を表す。各チャンネルは独自の
editorial voice(システムプロンプト)・出力言語・投稿先を持つ。設定は
`src/lib/article.ts` の `CHANNELS` に集約。

| direction | ブランド | 収集元 | 出力言語 | 投稿先 | 作風 |
|-----------|---------|--------|----------|--------|------|
| `en2ja`     | ランタンノート | Medium(英語) の AI / ビジネス / ライフハック / マインドフルネス | 日本語 | note   | 世界のトレンド × 禅の知恵のライフコーチ。最後に小さな実践 |
| `stillflow` | still flow / 円相 | Medium(英語) の 哲学 / ストア哲学 | 日本語 | note   | 禅 × 西洋哲学の瞑想的エッセイ。enso をモチーフに |
| `econ`      | (note、ブランド名未設定) | Medium(英語) の マーケティング / 経済 / リーダーシップ | 日本語 | note   | 行動経済学・マーケティング・海外ビジネス慣行の解説。煽り・商材誘導なし |
| `ja2en`     | (Medium) | note・日本語ブログ の 禅 / 茶道 / 漫画 / 日本文化 | 英語 | Medium | 日本文化を海外読者へ |

現在の日次自動生成は `en2ja` / `stillflow` / `econ` を各1本ずつ(note向け3ブランド)。
`ja2en`(Medium)は当面スケジュール対象外(手動 `direction=ja2en` で生成可)。

## データモデル（Prisma）

- **FeedSource** — 巡回する RSS/Atom フィード。`direction` と `category` を持つ。
- **ResearchItem** — フィードから収集したトレンド項目（title / url / summary）。`url` で重複排除。
  着想元であり、本文は保存しない（要約のみ）。
- **Article** — 生成されたオリジナル下書き。`researchItemId` で着想元を任意リンク。
  ステータスフロー: `idea → generated → review → approved → published` / `rejected`。

## API ルート

| メソッド | パス | 役割 |
|----------|------|------|
| GET/POST | `/api/feeds` | フィード一覧 / 追加 |
| POST | `/api/research` | アクティブなフィードを巡回し ResearchItem を収集 |
| GET | `/api/articles` | 記事下書き一覧（direction / status でフィルタ） |
| POST | `/api/articles` | ResearchItem または任意トピックからオリジナル下書きを生成 |
| GET/PATCH/DELETE | `/api/articles/[id]` | 取得 / ステータス更新・本文編集 / 削除 |
| POST | `/api/cron/pipeline` | 巡回→生成を一括実行（`CRON_SECRET` で保護） |

## スケジューリング（3時間ごと / 24時間ごと）

MVPでは **外部 cron が `/api/cron/pipeline` を叩く** 方式。アプリ内に常駐スケジューラは持たない
（サーバーレス/無料プランで安定するため）。

`Authorization: Bearer $CRON_SECRET` ヘッダで保護。ボディで `direction` と生成本数 `count` を指定。

### 現在の設定: 毎日1回・note向けのみ4本

```
0 0 * * *  →  POST /api/cron/pipeline  { "count": 4, "direction": "en2ja" }
```

（3時間ごと両方向の例: `0 */3 * * *` + `{ "count": 1 }`）

- **Render**: `render.yaml` に `type: cron` サービスを追加し、`curl` で叩く。
- **GitHub Actions**: `.github/workflows/pipeline.yml` の `schedule:` で cron を設定。
- **外部サービス**: cron-job.org / EasyCron 等から叩く。

いずれも「24時間ごと」は `0 0 * * *`、「3時間ごと」は `0 */3 * * *`。

## 環境変数

```
OPENAI_API_KEY=      # 既存。記事生成に使用
CRON_SECRET=         # /api/cron/pipeline 保護用のランダム文字列
ARTICLE_MODEL=gpt-4o # 任意。既定 gpt-4o
```

## レビュー画面

`/articles` に一覧＋レビューUI。direction / status でフィルタし、生成本文を確認して
`approve` / `reject` / 本文編集ができる。承認後、人間が Medium / note に手動投稿する。

## 今後のTODO（MVP外）

- 承認済み記事の Markdown / クリップボード用整形エクスポート
- note / Medium への半自動投稿補助（規約順守の範囲で）
- 重複トピック検出・カテゴリ別の生成本数バランス調整
- 生成品質スコアリング（ポスターの qualityScore 相当）
