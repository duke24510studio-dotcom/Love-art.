# Render で公開

## OpenAI API キーとは？

**OpenAI（ChatGPT の会社）に「このアプリから画像・文章を生成していい」と伝える合言葉**です。

- こちらから自動で作ることはできません（あなたの OpenAI アカウントで1回だけ発行）
- 無料枠／従量課金あり → [platform.openai.com/api-keys](https://platform.openai.com/api-keys) で `sk-...` をコピー

### いちばん簡単な設定（ローカル + Render 同期）

```powershell
cd c:\Users\satos\japandi-poster-auto-studio
npm run setup:openai
```

1. 表示された OpenAI のページでキーを作成して貼り付け  
2. `.env` に保存される  
3. `RENDER_API_KEY` も `.env` にある場合 → **Render にも自動反映**

Render API キー（任意・Render 自動反映用）:  
[dashboard.render.com → Account Settings → API Keys](https://dashboard.render.com/u/settings#api-keys)

```env
RENDER_API_KEY=rnd_...
RENDER_SERVICE_NAME=japandi-poster-studio
```

手動だけなら Render ダッシュボード → サービス → **Environment** → `OPENAI_API_KEY` = あなたの `sk-...`

---

## デプロイ手順

1. **[Render でデプロイ](https://render.com/deploy?repo=https://github.com/duke24510studio-dotcom/Love-art.)** を開く  
2. GitHub 連携 → **Apply**  
3. 上の `npm run setup:openai` でキーを用意（Render 画面で聞かれたら同じ `sk-...` を貼る）  
4. デプロイ完了後 URL を開く → `/posters`（管理画面）または `/blog`（公開ブログ）

初回は **20テーマ・公開ブログ記事5本が自動投入** されます。

---

## 公開ブログと管理画面の分離（重要）

`/blog` は認証なしで公開される唯一のページです（アフィリエイトプログラム審査用の
サイトURLとして使う想定）。それ以外（`/`, `/posters`, `/articles`, `/products` 等）は
削除ボタンや課金の発生するAI生成ボタンがあるため、Basic認証で保護されます。

Render の Environment で以下を設定してください（未設定だと管理画面は503のまま。
`/blog` には影響しません）：

```env
ADMIN_BASIC_USER=お好きなユーザー名
ADMIN_BASIC_PASS=お好きなパスワード
```

詳細は [docs/BLOG.md](./docs/BLOG.md) を参照。
