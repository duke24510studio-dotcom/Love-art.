export type Category = "内服" | "注射・点滴" | "外用" | "点眼";

export type Severity = "禁忌" | "重要" | "注意";

export interface Interaction {
  /** 相手の薬剤・食品など */
  target: string;
  /** 相互作用データベースの照合用キーワード(一般名・分類名) */
  keywords: string[];
  severity: Severity;
  /** 何が起こるか */
  effect: string;
  /** 看護師がどう動くか */
  action: string;
}

export interface IvCompatibility {
  /** 配合変化を起こす代表的な薬剤 */
  incompatible: string[];
  /** 希釈・投与速度などのルール */
  rules: string[];
}

export interface Drug {
  id: string;
  genericName: string;
  brandNames: string[];
  /** ひらがな検索用 */
  kana: string;
  category: Category;
  drugClass: string;
  /** ハイリスク薬フラグ */
  highAlert: boolean;
  indications: string[];
  /** よくある副作用 */
  commonSideEffects: string[];
  /** 重大な副作用(初期症状を含む) */
  seriousSideEffects: string[];
  contraindications: string[];
  interactions: Interaction[];
  /** 注射・点滴の場合の配合変化情報 */
  iv?: IvCompatibility;
  /** 使用上の注意 */
  precautions: string[];
  /** 看護のポイント・観察項目 */
  nursingPoints: string[];
}
