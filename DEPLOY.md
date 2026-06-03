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
4. デプロイ完了後 URL を開く → `/posters`

初回は **20テーマが自動投入** されます。
