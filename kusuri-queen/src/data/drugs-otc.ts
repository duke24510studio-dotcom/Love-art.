import type { Drug } from "../types";

// 市販薬(OTC)としても広く使われる単一成分薬。医療用と成分は同じため
// 臨床情報は医療用に準ずる。配合感冒薬など複数成分の市販薬は成分ごとに
// 添付文書を確認すること。
export const otcDrugs: Drug[] = [
  {
    id: "ibuprofen",
    genericName: "イブプロフェン",
    brandNames: ["ブルフェン", "イブ(市販)", "イブA錠(市販)"],
    kana: "いぶぷろふぇん ぶるふぇん いぶ",
    category: "内服",
    drugClass: "NSAIDs(非ステロイド性抗炎症薬)",
    highAlert: false,
    indications: ["頭痛・生理痛・歯痛などの鎮痛", "解熱", "関節痛・筋肉痛"],
    commonSideEffects: ["胃部不快感", "悪心", "腹痛", "眠気", "発疹"],
    seriousSideEffects: [
      "消化性潰瘍・消化管出血(黒色便・吐血)",
      "ショック・アナフィラキシー",
      "アスピリン喘息(気管支痙攣)",
      "急性腎障害",
      "無菌性髄膜炎",
    ],
    contraindications: [
      "消化性潰瘍のある患者",
      "アスピリン喘息の既往",
      "重篤な心・腎・肝・血液障害",
      "妊娠後期",
    ],
    interactions: [
      {
        target: "抗凝固薬・抗血小板薬",
        keywords: ["ワルファリン", "アスピリン", "クロピドグレル"],
        severity: "重要",
        effect: "出血リスクが増大",
        action: "出血徴候(黒色便・あざ)を観察",
      },
      {
        target: "低用量アスピリン",
        keywords: ["アスピリン"],
        severity: "注意",
        effect: "アスピリンの抗血小板作用を減弱させる報告",
        action: "服用タイミングを医師・薬剤師に相談",
      },
      {
        target: "降圧薬・利尿薬",
        keywords: ["ARB", "ACE", "フロセミド"],
        severity: "注意",
        effect: "降圧・利尿効果の減弱、腎機能悪化",
        action: "血圧・腎機能・浮腫を観察",
      },
    ],
    precautions: [
      "空腹時を避けて服用",
      "市販薬は他の解熱鎮痛薬・感冒薬との成分重複に注意",
      "高齢者・脱水時は腎障害に注意",
    ],
    nursingPoints: [
      "黒色便・心窩部痛は消化管出血のサイン、報告",
      "喘息既往者の発作誘発に注意",
      "他のNSAIDs含有市販薬との併用を確認",
    ],
  },
  {
    id: "loperamide",
    genericName: "ロペラミド塩酸塩",
    brandNames: ["ロペミン", "トメダイン(市販)"],
    kana: "ろぺらみど ろぺみん とめだいん",
    category: "内服",
    drugClass: "止瀉薬(腸管μオピオイド受容体作動)",
    highAlert: false,
    indications: ["下痢症"],
    commonSideEffects: ["便秘", "腹部膨満", "悪心", "口渇", "眠気"],
    seriousSideEffects: [
      "イレウス・巨大結腸",
      "ショック・アナフィラキシー",
      "皮膚粘膜眼症候群(SJS)",
      "高用量乱用によるQT延長・致死性不整脈",
    ],
    contraindications: [
      "出血性大腸炎・感染性下痢(原因菌排出を遅らせるおそれ)",
      "抗菌薬投与に伴う偽膜性大腸炎",
      "低出生体重児・乳児・6か月未満",
      "本剤過敏症",
    ],
    interactions: [
      {
        target: "CYP3A4・P糖蛋白阻害薬",
        keywords: ["イトラコナゾール", "キニジン"],
        severity: "注意",
        effect: "本剤の血中濃度上昇で中枢・心毒性のおそれ",
        action: "過量服用を避け、心症状を観察",
      },
    ],
    precautions: [
      "発熱・血便を伴う下痢では安易に使用しない(感染性を除外)",
      "規定量を超えて服用しない(不整脈リスク)",
      "脱水時は水分・電解質補給を併用",
    ],
    nursingPoints: [
      "排便回数・性状・腹痛・発熱・血便を観察",
      "腹部膨満・腹痛増強(イレウス)は報告",
      "脱水徴候(口渇・尿量減少)を観察",
    ],
  },
];
