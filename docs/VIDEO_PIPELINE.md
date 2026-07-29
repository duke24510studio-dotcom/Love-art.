# note記事 → YouTube動画パイプライン

note向けの記事を「いろんなジャンル」で自動生成し、その記事から YouTube 動画一式
（ナレーション台本・シーン画像・音声・字幕・概要欄・サムネイル）を作るための設計。

投稿の自動化はしない。書き出した動画とメタデータを人が確認してから、自分で
YouTube にアップロードする。これは他のパイプライン（note / Etsy / 楽天レビュー）と
同じ方針。

---

## 全体の流れ

```
① 記事を作る          /articles       POST /api/articles        (direction=note + genre)
② 文章を人の手触りに   /articles/[id]  POST /api/articles/[id]/humanize
③ 動画の台本を作る     /videos         POST /api/videos          (articleId or topic)
④ シーン画像を生成     /videos/[id]    POST /api/videos/[id]/images
⑤ ナレーションを生成   /videos/[id]    POST /api/videos/[id]/narration
⑥ サムネ背景を生成     /videos/[id]    POST /api/videos/[id]/images {target:"thumbnail"}
⑦ 動画を書き出す       /videos/[id]/studio   ← ブラウザ内でエンコード
⑧ 字幕を落とす         GET /api/videos/[id]/srt
⑨ 人が確認 → YouTube へ手動アップロード
```

ステータス: `planned → images → narrated → ready → published / rejected`

---

## ① マルチジャンルの記事生成

`src/lib/genres.ts` に12ジャンルのプリセットがある。

| key | ジャンル |
| --- | --- |
| `lifestyle` | 暮らしと日用品 |
| `sleep` | 睡眠と体調のリズム |
| `kakei` | 家計とお金の基本 |
| `work` | 仕事術とキャリア |
| `ai-tools` | AIとデジタル道具 |
| `reading` | 学びと読書 |
| `kokoro` | こころの整え方 |
| `food` | 食と台所 |
| `travel` | 旅と日本の風景 |
| `kosodate` | 子育てと家族 |
| `hobby` | 趣味と創作 |
| `seiri` | 片づけと持ち物 |

既存の4チャンネル（`en2ja` / `stillflow` / `econ` / `ja2en`）は固定の編集方針を持つが、
新しい `direction = "note"` はジャンルプリセットから system prompt を組み立てる汎用
チャンネル。`Article.genre` にプリセットのキーが入る。

各プリセットは persona / structure / tagSeeds に加えて **cautions**（そのジャンル固有の
禁止事項）を持つ。例:

- `sleep` — 診断・治療の助言、症状名の断定、サプリの推奨は禁止。「続く場合は医療機関へ」を添える
- `kakei` — 投資推奨・銘柄名・利回り提示・副業やスクールへの誘導は禁止
- `kokoro` — 精神医療の助言、スピリチュアルな断定（引き寄せ等）は禁止

ギャンブル・出会い・アダルト・夜職・宗教勧誘・政治活動のジャンルは意図的に入れていない
（アフィリエイトプログラムの禁止ジャンルと重なるため。docs/BLOG.md と同じ方針）。

ジャンル未指定のときは `pickRotatingGenre()` が日替わりで選ぶ。cron で `count=3` を
指定すると3本それぞれ別ジャンルになる。

## ② 推敲パス（humanize）

`src/lib/humanize-passes.ts` に8つの推敲パス。1パス＝1回のモデル呼び出しで、
選んだ順ではなく**正規の順序**（①→⑧）に並べ替えて直列に適用する。

| key | ラベル | 内容 |
| --- | --- | --- |
| `editor` | ① 編集長 | 硬い構造をほどいて会話に近い運びに |
| `human` | ② 人間化 | 経験者が書いたような語彙とリズムに |
| `deformula` | ③ 型くずし | 定型パターンを崩し、文長に変化をつける |
| `talk` | ④ 語りかけ | 親しい専門家が話すようなカジュアルさに |
| `warmth` | ⑤ 体温 | 感情の起伏と強弱を入れる |
| `plain` | ⑥ 地声 | 飾りを落とし、核心をまっすぐ書く |
| `rhythm` | ⑦ リズム | 文長とペースを整える |
| `finish` | ⑧ 仕上げ | 実在の書き手の最終稿にする（最後に） |

**元ネタとの違い（重要）**

参照した元のプロンプト集には「AIが書いたと感じさせないように直す（すり抜け）」という
趣旨のパスが含まれていた。このアプリは全パイプラインが AI 開示を前提に作られている
（記事・ブログ・ポスター・レビューすべてに開示文が入る）ため、そのパスは
**AI検出の回避ではなく、読みにくい定型文を落とす文章品質のパス**（③型くずし）として
実装している。加えて:

- すべてのパスの system prompt が「末尾のAI開示文をそのまま残すこと」を必須にしている
- それでも消えた場合は `restoreDisclosure()` がサーバ側で必ず付け直す
- 事実・数字・体験談の**追加**は全パスで禁止（推敲であって書き直しではない）

初回の推敲時に元の本文が `Article.rawBody` に退避されるので、`DELETE
/api/articles/[id]/humanize` でいつでも推敲前に戻せる。

## ③ 動画の台本

`POST /api/videos` が1回の OpenAI 呼び出しで以下をまとめて生成する。

- `title` / `description` / `tags` / `thumbnailText` / `thumbnailPrompt`
- `scenes[]`: `heading`（チャプター名）, `narration`（読み上げ文）,
  `onScreenText`（焼き込みテロップ, 22文字以内）, `imagePrompt`（英語）, `seconds`

フォーマット:

| format | 画角 | シーン数 | 1シーンの尺 | 想定長さ |
| --- | --- | --- | --- | --- |
| `long` | 16:9 | 10〜14 | 90〜160字 / 15〜25秒 | 4〜6分 |
| `short` | 9:16 | 5〜7 | 30〜55字 / 5〜9秒 | 60秒未満 |

台本の禁止事項は system prompt に固定されている: 煽りタイトル（【】連打・「衝撃」「神」
など）、恐怖訴求、根拠のない断定、統計や価格の捏造、URL やアフィリエイトリンク、
「絶対」「日本一」等の最上級。概要欄の末尾には `VIDEO_DISCLOSURE_JA` が必ず入る。

チャプターは `buildChapters()` がシーンの実尺から組み立てる。YouTube の要件
（最初が 0:00、3つ以上、各10秒以上）を満たせないときは空文字を返す（不正なチャプター
を出すより出さない方がいい）。

## ④ シーン画像

`src/lib/video-style.ts` に5つの映像スタイル: `japandi` / `aizuri`（藍摺り）/ `photo` /
`sumi`（墨絵）/ `flat`。

画像には**文字を一切入れない**。テロップ・タイトル・字幕はすべてブラウザ側で
Canvas に描く。画像モデルに日本語を書かせると崩れるうえ、あとから直せないため。

生成は1シーンずつ順番（Render 無料プランは512MB。並列にすると OOM とレート制限の
両方を踏む）。1リクエストあたり既定4シーンまでで、UI が残りを見て繰り返し呼ぶ。

環境変数: `VIDEO_IMAGE_MODEL`（既定 `POSTER_IMAGE_MODEL` → `gpt-image-1`）、
`VIDEO_IMAGE_QUALITY`（既定 `medium`）。

## ⑤ ナレーション

OpenAI TTS（既定 `gpt-4o-mini-tts`、`TTS_MODEL` で変更可）。声は `VIDEO_VOICES` から選ぶ。
落ち着いた読み方の instructions を固定で渡している。

mp3 は `ImageAsset` テーブル（＝アプリのバイナリ置き場）に
`outputs/images/narration/<sceneId>.mp3` として保存し、既存の `/api/static` 経由で
`/outputs/images/narration/<sceneId>.mp3` から配信される。

尺は `src/lib/mp3-duration.ts` が MPEG フレームヘッダを直接読んで測る（Render に ffmpeg は
入っておらず、依存を増やしたくないため）。パースに失敗したら文字数からの推定値
（約6.5文字/秒）にフォールバックする。

## ⑦ 動画の書き出し（ブラウザ内）

`/videos/[id]/studio`。サーバでエンコードしない理由は明確で、**Render の無料プランに
ffmpeg がなく、メモリも512MBしかない**（ポスターの4倍アップスケールで実際に OOM kill
された前例がある — render.yaml のコメント参照）。

やっていること:

1. シーン画像を `Image` に、ナレーション mp3 を `AudioBuffer` に事前読み込み
2. 1つの `AudioContext` に全クリップを開始時刻付きでスケジュール
3. `requestAnimationFrame` で Canvas（1920×1080 または 1080×1920）に描画
   — ゆっくりしたケンバーンズ、0.6秒のクロスフェード、下部にスクリム＋テロップ
4. `canvas.captureStream(30)` + `MediaStreamAudioDestinationNode` を `MediaRecorder` に渡す
5. 完了したら Blob を WebM (VP9 + Opus) としてダウンロード

制約（UI にも明記してある）:

- **実時間でエンコードされる。** 5分の動画には5分かかる
- 録画中はタブを前面に置く必要がある（バックグラウンドだと rAF が間引かれてコマ落ちする）
- Chrome / Edge 推奨。YouTube は WebM をそのまま受け付ける
- 音声はモニタ用ゲインを絞って録るので、録画中は無音に聞こえる

サムネイルは別ボタンで 1280×720（Shorts は 1080×1920）の PNG として書き出す。
`thumbnailText` を縁取り付きで中央に描画する。

## ⑧ 字幕

`GET /api/videos/[id]/srt`。ナレーション全文を、測定した実尺でタイミングを振った SRT。
1行22文字で折り返し、行頭に句読点や閉じ括弧が来ないようにしている。

焼き込みテロップ（`onScreenText`）は短い要約、SRT は読み上げ全文、という役割分担。
YouTube 側に字幕としてアップロードする方が読みやすいので、テロップ焼き込みは
スタジオ画面でオフにできる。

---

## Cron

`POST /api/cron/videos`（Bearer `CRON_SECRET`）。

承認済み（`approved` / `published`）でまだ動画が無い日本語記事を選び、台本を作る。
既定でシーン画像まで生成し、ナレーションは `narration=true` を渡したときだけ生成する
（TTS の課金と実行時間が大きいため）。

```
POST /api/cron/videos
{ "count": 1, "format": "long", "visualStyle": "japandi", "narration": false }
```

記事側の cron（`POST /api/cron/pipeline`）にも `note` チャンネルが追加されていて、
`genre` を省略すると日替わりでジャンルが回る。

---

## やらないこと

- YouTube API での自動アップロード（OAuth が必要。そもそも人のレビューを挟む方針）
- サーバサイドの動画エンコード（上記の理由）
- 実写・実在人物・既存キャラクターの生成
- 概要欄への URL / アフィリエイトリンクの自動挿入
