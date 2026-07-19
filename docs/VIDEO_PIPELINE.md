# Video Pipeline — Japandi Faceless YouTube Studio

日本の侘び寂び・禅・ミニマリズムを暮らしに取り入れる「Japanese Lifestyle系 Faceless YouTube」動画を
自動生成するパイプライン。ポスター/記事パイプラインと同じ思想 —
**自動生成するが自動公開しない・人間レビュー必須** — で設計する。

ターゲット: 欧米（US/UK/CA/AU）の30〜50代。落ち着いた英語ナレーション＋静かな日本的映像。
長尺（8〜18分）中心でエバーグリーンな検索需要を狙う。

## ⚠️ ポリシー（最重要）

- 台本は **完全オリジナル**。既存動画・記事・書籍の再現をしない。
- 文化的に正確・敬意ある内容のみ。ステレオタイプ、オリエンタリズム的表現、捏造した統計・引用は禁止。
- 健康・長寿の話題は「文化的な習慣」として扱い、医療アドバイスにしない。
- 実在の人物・ブランド・著作権キャラクターを画像/台本に使わない。
- **YouTubeへのアップロードは人間がレビューしてから手動で行う**。低品質な完全自動量産は
  YouTubeのポリシー上もリスクなので、公開前の事実確認・編集を必ず入れる。
- 概要欄に AI 利用の開示文を自動付与する（削除しない）。

## パイプライン（4ステップ）

```
① Script   — OpenAI chat: タイトル/概要欄/タグ/サムネ案 + 8〜16シーンの台本(JSON)
② Voice    — OpenAI TTS (gpt-4o-mini-tts): シーンごとのナレーションMP3
③ Visuals  — DALL-E 3 (1792x1024): シーンごとの静止画 + サムネ背景
④ Assemble — ffmpeg: 静止画+音声 → 1920x1080 MP4（シーン連結）
→ Review   — /videos でレビュー、approve / reject
→ Export   — ZIP（script.md / metadata.txt / images / audio / video.mp4）
```

BGM・トランジション・サムネ文字入れは CapCut / Canva 等での手作業を想定（テンプレ化推奨）。

ステータスフロー:

```
idea → scripted → voiced → visualized → assembled → review → approved → exported
                                                            ↘ rejected
```

## データモデル（Prisma）

- **VideoProject** — 1本の動画企画。pillar（コンテンツの柱）、topic、YouTubeメタデータ、
  サムネ、動画パス、ステータスを持つ。
- **VideoScene** — シーン単位のナレーション・画像プロンプト・生成アセットパス・秒数。

生成物は `outputs/videos/{projectId}/` 配下（scenes/ audio/ segments/ thumbnail.png video.mp4）。

## コンテンツの柱（トピックバンク内蔵）

morning-routine / minimal-home / kitchen / calm-mind / longevity / mottainai / ikigai /
cleaning-ritual / wabi-sabi。各柱にエバーグリーンなトピック例を内蔵し、
トピック未指定なら未使用のものから自動選択する。

## API ルート

| メソッド | パス | 役割 |
|----------|------|------|
| GET/POST | `/api/videos` | プロジェクト一覧 / 作成（topic省略で自動選択） |
| GET/PATCH/DELETE | `/api/videos/[id]` | 取得 / メタデータ・ステータス更新 / 削除（アセットも削除） |
| POST | `/api/generate/video-script` | ① 台本+メタデータ生成 `{ projectId }` |
| POST | `/api/generate/video-audio` | ② ナレーションTTS `{ projectId }` |
| POST | `/api/generate/video-visuals` | ③ シーン画像+サムネ生成 `{ projectId }` |
| POST | `/api/videos/[id]/assemble` | ④ ffmpegでMP4組み立て |
| POST | `/api/videos/[id]/export` | ZIPパッケージのダウンロード |
| GET | `/api/videos/static/...` | 生成アセットの配信（レビューUI用） |
| POST | `/api/cron/video-pipeline` | 自動実行（`CRON_SECRET` で保護） |

## 自動実行（cron）

`POST /api/cron/video-pipeline` を外部cronで叩く。`Authorization: Bearer $CRON_SECRET`。

- `{ "mode": "script" }`（既定）: 企画＋台本のみ生成（安価）。音声・画像はレビュー後に手動実行。
- `{ "mode": "full" }`: 台本→音声→画像→組み立てまで一括（APIコスト大。ffmpeg無しなら組み立てをスキップ）。
- `topic` / `pillar` をボディで指定可能。省略時はトピックバンクから未使用のものを選ぶ。

例: 週3本ペースなら `0 6 * * 1,3,5` で1本ずつ。

## 環境変数

```
OPENAI_API_KEY=              # 既存。台本/TTS/画像すべてに使用
CRON_SECRET=                 # 既存。cronルート保護
VIDEO_SCRIPT_MODEL=gpt-4o    # 任意
VIDEO_TTS_MODEL=gpt-4o-mini-tts  # 任意
VIDEO_TTS_VOICE=onyx         # 任意（プロジェクト設定を上書き）
VIDEO_IMAGE_QUALITY=standard # 任意。"hd" で高品質（高コスト）
```

ffmpeg / ffprobe が PATH にあると ④ 組み立てと正確な音声秒数計測が有効になる。
無くても ①〜③ とZIPエクスポートは動く（動画組み立てだけ手元のCapCut等で行う運用も可）。

## レビュー画面

`/videos` に一覧、`/videos/[id]` にレビューUI。パイプライン実行ボタン、シーンごとの
画像プレビュー＋音声プレーヤー、YouTubeタイトル/概要欄/タグのコピー、承認/却下、ZIPダウンロード。

## コスト目安（1本 / 10分 / 13シーン）

- 台本: gpt-4o 1回（数円〜十数円）
- TTS: 約1400語（数十円）
- 画像: DALL-E 3 standard ×14枚（約$0.56 ≒ 90円）／ hd なら約2倍

## 今後のTODO（MVP外）

- Ken Burns（ズーム/パン）エフェクト付き組み立て
- BGMトラックの自動ミックス（ロイヤリティフリー素材の管理）
- 字幕ファイル（SRT）自動生成
- YouTube Data API での半自動アップロード（規約順守の範囲で）
- サムネ文字入れの自動合成
