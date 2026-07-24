# 公開ブログ「茶と暮らしの手帖」 (`/blog`)

アフィリエイトプログラム（楽天アフィリエイト等）の審査には「実際にアクセスできる、
中身のあるサイトURL」が必要になる。このアプリはもともと未認証の内部管理ツール
（`Local MVP`）として作られていたため、`/blog` はその中で唯一、認証なしで公開する
ことを前提としたパートだけを切り出したもの。

## なぜ Article / ProductReview と別モデルなのか

- **Article**（`src/lib/article.ts`）: note / Medium に**手動で貼り付けて投稿する**下書き。
  このアプリ自体には公開ページがない。
- **ProductReview**（`src/lib/review.ts`）: 追跡中の**特定商品**について、5人の紹介
  キャラクターが書く紹介記事。「PR」表記必須、商品と強く紐づく。
- **BlogPost**（`src/lib/blog.ts`）: このアプリが**自ら公開する**唯一のコンテンツ。
  特定商品の宣伝ではなく、ジャンル全体（お茶・食品ギフト）についての一般的な
  買い物ガイド。アフィリエイトIDがまだ無い審査前の段階でも、事実に反する内容が
  一切ない。

## 構成

- `src/lib/blog.ts` — サイト名・タグライン・AI開示文・シード記事5本。
- `prisma/seed-blog.ts` — 手動シード用（`npm run seed:blog`）。
- `src/instrumentation.ts` — サーバー起動時に `BlogPost` が0件なら自動シード
  （ポスターテーマの自動投入と同じ仕組み）。Render に初回デプロイしただけで
  記事が入った状態になる。
- `src/app/blog/layout.tsx` / `page.tsx` / `[slug]/page.tsx` / `about/page.tsx` —
  公開ページ。管理画面のナビゲーション・削除ボタン・生成ボタンは一切表示しない。
- `src/lib/simple-markdown.tsx` — 見出し・箇条書き・太字・区切り線だけを扱う
  依存ライブラリ無しの軽量Markdownレンダラー（自分たちが書いたコンテンツのみを
  描画するため `dangerouslySetInnerHTML` は使わない）。
- `src/app/(admin)/blog-posts` — 記事管理CMS（一覧・新規作成・編集・公開/非公開切替・
  削除）。Basic認証で保護された管理画面側にあり、URLは `/blog-posts`
  （公開側の `/blog` とは別パス）。API は `src/app/api/blog/`。

## 認証境界（重要）

管理画面（`/`, `/posters`, `/articles`, `/products`, `/youtube-multiview` とその API）
には削除ボタンと、課金が発生するAI生成ボタンがある。**これを認証なしでインター
ネットに公開してはいけない。**

`src/proxy.ts` が `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS` によるBasic認証を
`/blog` 以外の全ルートに適用する。本番（`NODE_ENV=production`）でこの2つが未設定
の場合、管理画面は開放されるのではなく **503 で塞がる**（フェイルクローズ）。

`/blog`, `/blog/*`, `/api/static/*`（画像配信）, `/outputs/*`, `/favicon.ico` は
常に認証なしでアクセスできる。

Render の `healthCheckPath` は `/blog` に設定してある（`/` は認証保護対象のため
ヘルスチェックが通らなくなる）。

## コンテンツポリシー

- 特定商品の購入・使用を証言する体裁にはしない（それは ProductReview の役割）。
- 事実に基づく一般的な選び方の解説記事のみ。捏造データ・誇大表現は書かない。
- 各記事末尾にAI利用の開示文（`BLOG_DISCLOSURE_JA`）を必ず含める。
- ギャンブル・出会い・成人向け・スピリチュアル/占い・ナイトワークは扱わない
  （Rakuten Affiliate 含む多くのプログラムの審査で禁止ジャンルとされているため）。

## 公開してから審査に出すまで

1. このブランチを `main` にマージ（または Render サービスの向き先をこのブランチに
   一時的に変更）→ Render が自動デプロイ。
2. Render の Environment で `ADMIN_BASIC_USER` / `ADMIN_BASIC_PASS` を設定
   （設定しないと管理画面が503のままだが、`/blog` は問題なく公開される）。
3. デプロイ後、`https://<your-app>.onrender.com/blog` にアクセスして記事5本が
   表示されることを確認。
4. `src/app/blog/about/page.tsx` の連絡先プレースホルダーを実際の連絡先に置き換える。
5. 楽天アフィリエイトのサイト登録フォームに `/blog` のURLを入力して審査へ。

## 記事を追加する（運用中）

管理画面の **Blog CMS**（`/blog-posts`、Basic認証が必要）から追加・編集・公開/非公開の
切り替え・削除ができる。新規作成は `/blog-posts/new`。本文はMarkdownのサブセット
（`## 見出し`, `- 箇条書き`, `1. 番号付きリスト`, `**太字**`, `---` 区切り線）に対応。
公開（published）にすると即座に `/blog` に表示される。

コンテンツポリシー（特定商品の証言レビューにしない・捏造データ禁止・AI開示文必須・
禁止ジャンル回避）は自動では強制されないため、公開前に上記「コンテンツポリシー」の
節を必ず確認すること。

## 今後のTODO

- 独自ドメインの設定（Render の Custom Domain 機能）
- サイトマップ / robots.txt
- コンテンツポリシーのCMS側でのチェック（AI開示文の自動付与など）
