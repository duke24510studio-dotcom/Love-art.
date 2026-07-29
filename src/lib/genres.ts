// Multi-genre note (note.com) article presets.
//
// The four original channels in src/lib/article.ts (en2ja / stillflow / econ /
// ja2en) each have a fixed editorial identity. This file adds the OTHER axis:
// a generic "note" channel that can write across many everyday genres, so the
// studio isn't limited to Zen essays and behavioural economics.
//
// Every preset stays inside the app's content policy (see CLAUDE.md "Safety"):
// no gambling, dating, adult, occult/spiritual-claims, night-work, political
// campaigning, get-rich-quick, or medical-treatment genres. Health and money
// genres are deliberately framed as "everyday habits" / "household basics",
// never as diagnosis or investment advice.

export type GenreKey =
  | "lifestyle"
  | "sleep"
  | "kakei"
  | "work"
  | "ai-tools"
  | "reading"
  | "kokoro"
  | "food"
  | "travel"
  | "kosodate"
  | "hobby"
  | "seiri";

export type GenrePreset = {
  key: GenreKey;
  /** Japanese label shown in the UI. */
  labelJa: string;
  /** One-line description of the genre for the UI. */
  descriptionJa: string;
  /** Who the writer is, in the article's voice. */
  persona: string;
  /** Article shape the model should follow. */
  structure: string;
  /** Seed hashtags — the model mixes these with topic-specific ones. */
  tagSeeds: string;
  /** Genre-specific things the model must never do. */
  cautions: string;
  /** Rotating topics used when no explicit topic is given. */
  topics: string[];
};

export const GENRE_PRESETS: GenrePreset[] = [
  {
    key: "lifestyle",
    labelJa: "暮らしと日用品",
    descriptionJa: "毎日使うものを、少しだけ良くする話",
    persona:
      "日々の暮らしを丁寧に見つめる書き手。ミニマルだが禁欲的ではなく、「少ないけれど気に入ったものと暮らす」感覚を大事にする。",
    structure:
      "生活のなかの小さな不便や違和感の描写 → なぜそれが起きるのかを落ち着いて分解 → 具体的な選び方・使い方・手放し方 → 今日ひとつだけ試せること",
    tagSeeds: "暮らし, 日用品, シンプルライフ, 丁寧な暮らし, 買ってよかったもの",
    cautions:
      "特定ブランドを持ち上げたり比較して貶めたりしない。実際に使っていない製品を「愛用している」と書かない。",
    topics: [
      "タオルを買い替える周期を決めたら、朝が少し変わった",
      "収納を増やす前に、置き場所のない物を数えてみる",
      "毎日使うものだけ「ちょっといい物」にするという考え方",
      "掃除道具を減らしたら、掃除の回数が増えた話",
    ],
  },
  {
    key: "sleep",
    labelJa: "睡眠と体調のリズム",
    descriptionJa: "眠り・休息・生活リズムを整える習慣",
    persona:
      "自分の不調と付き合いながら生活リズムを立て直してきた書き手。専門家ではなく、実践者として書く。",
    structure:
      "眠れない・だるい夜の具体的な描写 → 生活リズムの観点から何が起きているかを一般論として整理 → 今夜から変えられる小さな行動 → 効果を焦らないための言葉",
    tagSeeds: "睡眠, 生活リズム, 休息, セルフケア, 朝活",
    cautions:
      "医療行為・診断・治療の助言をしない。症状名の断定、サプリや医薬品の推奨、効果効能の断定は禁止。「気になる症状が続くときは医療機関へ」という一文を自然に添える。統計や研究を捏造しない。",
    topics: [
      "夜にスマホを置く場所を変えるだけの実験",
      "「早く寝る」より「起きる時間を固定する」が先だった",
      "休日に寝だめしても回復しない、その感覚の正体",
      "夕方の眠気と、無理に戦わない過ごし方",
    ],
  },
  {
    key: "kakei",
    labelJa: "家計とお金の基本",
    descriptionJa: "生活者目線の、地に足のついたお金の話",
    persona:
      "派手な資産形成論ではなく、日々の家計を静かに整えることを重視する書き手。煽らず、脅さず、比較しない。",
    structure:
      "お金まわりの日常の場面 → 数字の見え方が歪む理由をやさしく説明 → 家計の仕組みとして直せる部分 → 今週ひとつだけ見直すもの",
    tagSeeds: "家計, 節約, お金の勉強, 固定費, 暮らしとお金",
    cautions:
      "投資の推奨・銘柄名・利回りの提示・「必ず増える」といった断定は禁止。副業やスクールへの誘導も禁止。具体的な金額例は「たとえば」の仮定として書き、実在の統計を装わない。",
    topics: [
      "固定費を一度だけ本気で見直す日をつくる",
      "「安いから買う」が積み上がると何が起きるか",
      "家計簿が続かない人のための、月一回だけの記録法",
      "サブスクの棚卸しを、年に二回だけやると決めた",
    ],
  },
  {
    key: "work",
    labelJa: "仕事術とキャリア",
    descriptionJa: "会議・段取り・伝え方など、働き方の実務",
    persona:
      "現場で試行錯誤している中堅の書き手。上から教えるのではなく、自分の失敗を材料に語る。",
    structure:
      "職場のよくある場面 → 何が噛み合っていないのかの分解 → 明日から使える具体的な言い方・段取り → 一つだけ持ち帰る指針",
    tagSeeds: "仕事術, 働き方, キャリア, コミュニケーション, 生産性",
    cautions:
      "特定の企業・業界を貶めない。ハラスメントや労働問題は一般論に留め、法的助言をしない。転職サービスへの誘導はしない。",
    topics: [
      "議事録を「決まったこと」から書き始める",
      "相談を持ちかけるとき、最初の一文で決まること",
      "抱え込みが癖になっている人の、断り方の型",
      "会議を15分短くするために、事前にやる一手間",
    ],
  },
  {
    key: "ai-tools",
    labelJa: "AIとデジタル道具",
    descriptionJa: "AI・アプリ・ガジェットを、生活の道具として捉える",
    persona:
      "新しい道具を面白がりつつ、使いこなせなかった経験も正直に書く実務家。誇張しない。",
    structure:
      "実際に困っていた作業 → その道具でどう変わったか（できなかったことも書く） → 使い方の具体手順 → 向いている人・向いていない人",
    tagSeeds: "AI, 生成AI, ガジェット, 効率化, デジタル整理",
    cautions:
      "存在しない機能・料金・スペックを書かない。数値やモデル名が不確かなときは断定せず一般的に書く。特定サービスへのアフィリエイト的な煽りをしない。",
    topics: [
      "AIに頼む前に、自分で決めておくべきこと",
      "文章をAIに直してもらうときの、指示の粒度",
      "通知を減らすためのスマホ設定を、一度だけ本気でやる",
      "写真の整理をアプリ任せにして、うまくいかなかった話",
    ],
  },
  {
    key: "reading",
    labelJa: "学びと読書",
    descriptionJa: "本の読み方、学び方、知識の残し方",
    persona: "多読自慢をしない書き手。読めなかった本の話も書く。",
    structure:
      "読書や勉強がうまくいかない場面 → その原因を読み方・記録の仕組みから捉え直す → 具体的な方法 → 一冊・一項目から始める提案",
    tagSeeds: "読書, 学び, 読書記録, インプット, 勉強法",
    cautions:
      "実在の本の内容を要約・引用して代替物にしない。著者の主張を捏造しない。書名に触れるときは一般的な言及に留める。",
    topics: [
      "積読が減らないのは、選び方より置き場所の問題かもしれない",
      "読んだ内容を忘れる前提で、記録の形を変える",
      "最後まで読まない読書を、自分に許可する",
      "学び直しを始めるとき、最初の一週間で決まること",
    ],
  },
  {
    key: "kokoro",
    labelJa: "こころの整え方",
    descriptionJa: "不安・焦り・比較と距離を取るための実践",
    persona:
      "自戒を込めて書く実践者。断定せず、読者と並んで練習する姿勢を保つ。",
    structure:
      "心がざわつく具体的な場面 → 何に反応しているのかを静かに言語化 → 距離を取るための小さな練習 → 効果を求めすぎないための一言",
    tagSeeds: "マインドフルネス, セルフケア, 心の整理, 習慣, 内省",
    cautions:
      "精神医療の診断・治療の助言をしない。スピリチュアルな断定（引き寄せ、波動など）を事実として書かない。つらさが続く場合は専門機関に相談する旨を自然に添える。",
    topics: [
      "SNSを見た後の落ち込みに、名前をつけてみる",
      "焦りが強い日にやめる三つのこと",
      "「比べない」ではなく「比べたことに気づく」練習",
      "予定のない休日が落ち着かない、その感じについて",
    ],
  },
  {
    key: "food",
    labelJa: "食と台所",
    descriptionJa: "料理・買い物・台所仕事のリアルな工夫",
    persona: "毎日の料理に疲れることもある書き手。完璧な献立を勧めない。",
    structure:
      "台所での具体的な場面 → 手間が増える構造の分解 → 実際に回っている段取りや道具の使い方 → 今週ひとつ試せること",
    tagSeeds: "料理, 食事, 台所, 作り置き, 献立",
    cautions:
      "栄養や健康効果を断定しない（「痩せる」「治る」等は禁止）。食中毒に関わる保存期間は安全側に書き、曖昧な断定をしない。",
    topics: [
      "作り置きをやめて、下ごしらえだけ残した",
      "買い物メモを献立ではなく「食べたい形」で書く",
      "洗い物を減らす調理の順番",
      "平日の夜に決めごとを一つだけ作る",
    ],
  },
  {
    key: "travel",
    labelJa: "旅と日本の風景",
    descriptionJa: "近場の旅、季節の風景、土地の空気",
    persona: "観光案内ではなく、体験の質感を書く旅の書き手。",
    structure:
      "その場所の空気の描写 → なぜそこが印象に残ったのか → 訪ね方・時間帯・季節の具体 → 静かな締め",
    tagSeeds: "旅, 国内旅行, 日帰り旅, 風景, 季節",
    cautions:
      "営業時間・料金・アクセスなど、変わりやすい事実を断定しない（「公式サイトで確認を」と添える）。実在の店や宿を実体験のように捏造しない。",
    topics: [
      "早朝の町を歩くためだけに出かける",
      "同じ場所を、季節を変えて二度訪ねる",
      "観光地の「一本裏の道」で起きること",
      "何も決めない日帰りの組み立て方",
    ],
  },
  {
    key: "kosodate",
    labelJa: "子育てと家族",
    descriptionJa: "家庭のなかの、伝え方と時間の使い方",
    persona: "完璧でない親としての目線。他家庭のやり方を否定しない。",
    structure:
      "家庭の具体的な場面 → 何がぶつかっているのかの整理 → 言い方・仕組みで変えられる部分 → 抱え込まないための一言",
    tagSeeds: "子育て, 家族, 育児, 暮らし, 声かけ",
    cautions:
      "発達・医療・教育に関する断定や診断をしない。特定の教育法・園・学校を推奨または批判しない。家庭の形（ひとり親、共働き等）を優劣で語らない。",
    topics: [
      "朝の支度を急かす言葉を、一つだけ変えてみる",
      "「あとで」と言った約束を、書いて残す",
      "子どもの前で、親が失敗を見せるということ",
      "家族の予定を共有する場所を一つに絞る",
    ],
  },
  {
    key: "hobby",
    labelJa: "趣味と創作",
    descriptionJa: "続ける・作る・下手なままで楽しむ",
    persona: "上達至上主義から降りた書き手。始めたばかりの人に優しい。",
    structure:
      "続かなかった経験 → 続かない理由を仕組みから捉え直す → 続けるための具体的な小ささ → 上手くならなくてもいいという視点",
    tagSeeds: "趣味, 創作, 継続, 習慣化, 初心者",
    cautions: "才能論で読者を切り捨てない。高額な道具や講座を勧めない。",
    topics: [
      "毎日5分だけ、と決めたときに起きたこと",
      "作りかけのまま置いてある物との付き合い方",
      "人に見せない前提で作るという選択",
      "道具を買い足す前に、使い切る",
    ],
  },
  {
    key: "seiri",
    labelJa: "片づけと持ち物",
    descriptionJa: "捨てる・残す・置き場所を決める",
    persona: "ミニマリスト思想を押し付けない、現実的な整理の書き手。",
    structure:
      "散らかる場面の描写 → なぜそこに物が溜まるのかの構造分析 → 判断の基準と手順 → 一箇所だけから始める提案",
    tagSeeds: "片づけ, 整理収納, 断捨離, シンプルライフ, 暮らしの工夫",
    cautions:
      "「捨てられない人」を責めない。思い出の品を軽く扱わない。特定の収納用品を必需品のように書かない。",
    topics: [
      "玄関の一角だけを、空けたままにしておく",
      "「いつか使う」を、期限つきの箱に入れる",
      "捨てる基準を、物ではなく置き場所で決める",
      "書類が溜まるのは、開封する場所が決まっていないから",
    ],
  },
];

export const GENRE_KEYS: GenreKey[] = GENRE_PRESETS.map((g) => g.key);

export function isGenreKey(value: unknown): value is GenreKey {
  return typeof value === "string" && (GENRE_KEYS as string[]).includes(value);
}

export function getGenre(key: string): GenrePreset | null {
  return GENRE_PRESETS.find((g) => g.key === key) ?? null;
}

export function getGenreLabel(key: string): string {
  return getGenre(key)?.labelJa ?? key;
}

/** Rotate through a genre's topics so consecutive runs vary. */
export function pickGenreTopic(key: GenreKey): string {
  const genre = getGenre(key);
  if (!genre || genre.topics.length === 0) return "";
  return genre.topics[Math.floor(Date.now() / (3 * 60 * 60 * 1000)) % genre.topics.length];
}

/** Pick a genre deterministically-but-rotating, for cron runs with no genre given. */
export function pickRotatingGenre(offset = 0): GenrePreset {
  const index = (Math.floor(Date.now() / (24 * 60 * 60 * 1000)) + offset) % GENRE_PRESETS.length;
  return GENRE_PRESETS[index];
}
