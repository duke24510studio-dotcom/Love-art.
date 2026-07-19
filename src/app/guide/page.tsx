import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claude Code Guide — ブラウザ内蔵で調べ物ラクに",
  description:
    "Claude Code のブラウザ内蔵機能を紹介する縦型インフォグラフィックカード。AIが資料を直接読み、情報収集を時短します。",
};

/* ---------- Small inline icon set (self-contained, no external assets) ---------- */

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#5b9bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function IconTerminal() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#5b9bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9l3 3-3 3M13 15h4" />
      <rect x="3" y="4" width="18" height="16" rx="2" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#5b9bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#5b9bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#5b9bd5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
      <path d="M19 15l.8 2 2 .8-2 .8L19 21l-.8-2-2-.8 2-.8z" />
    </svg>
  );
}

/* ---------- Header badges & tool logos ---------- */

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ backgroundColor: "#1c2733", border: "1px solid #2c3a49", color: "#c7d0da" }}
    >
      <span style={{ color: "#5b9bd5", display: "inline-flex" }}>{icon}</span>
      {label}
    </span>
  );
}

function ToolLogo({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: 30, height: 30, backgroundColor: bg }}
      aria-hidden
    >
      {children}
    </span>
  );
}

/* ---------- Mock preview panels (right column of each feature) ---------- */

function MockShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="w-full overflow-hidden rounded-lg text-[11px]"
      style={{ backgroundColor: "#0c131d", border: "1px solid #26313f" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ borderBottom: "1px solid #1e2733" }}
      >
        <span className="flex gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "#f26d5f", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "#f2c14e", display: "inline-block" }} />
          <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "#5fbf72", display: "inline-block" }} />
        </span>
        <span style={{ color: "#8a95a3" }} className="truncate">{title}</span>
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

function MockTerminal() {
  return (
    <MockShell title="ターミナル — claude">
      <p style={{ color: "#aeb8c4" }} className="font-mono leading-relaxed">
        <span style={{ color: "#5fbf72" }}>{">"}</span> 別画面を開かず、AIの横で資料を読み込ませられ
        <br />る<span style={{ backgroundColor: "#aeb8c4", display: "inline-block", width: 6, height: 12, verticalAlign: "middle", marginLeft: 2 }} />
      </p>
    </MockShell>
  );
}

function MockMail() {
  const rows = [
    { who: "経理部 佐藤", sub: "【承認依頼】経費精算のご確認", time: "10:24", active: true },
    { who: "総務部 高橋", sub: "会議室予約の更新について", time: "9:58" },
    { who: "田中 部長", sub: "Re: 議事録ありがとう", time: "昨日" },
  ];
  return (
    <MockShell title="メール — 受信箱">
      <div className="space-y-1">
        {rows.map((r) => (
          <div
            key={r.sub}
            className="flex items-center gap-2 rounded px-1.5 py-1"
            style={{ backgroundColor: r.active ? "#1c3a63" : "transparent" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: r.active ? "#5b9bd5" : "#3a4653", display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: "#d3dae2" }} className="font-medium whitespace-nowrap">{r.who}</span>
            <span style={{ color: "#8a95a3" }} className="truncate flex-1">{r.sub}</span>
            <span style={{ color: "#6b7684" }} className="whitespace-nowrap">{r.time}</span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function MockBoard() {
  const cols = [
    { label: "やること", count: 3, chip: "データ入力", chipColor: "#5b9bd5" },
    { label: "作業中", count: 1, chip: "メール仕分け", chipColor: "#e8935a" },
    { label: "完了", count: 2, chip: "✓ 議事録作成", chipColor: "#5fbf72" },
  ];
  return (
    <MockShell title="タスク管理 — 事務ボード">
      <div className="grid grid-cols-3 gap-1.5">
        {cols.map((c) => (
          <div key={c.label} className="rounded px-1.5 py-1" style={{ backgroundColor: "#141d29" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "#8a95a3" }}>{c.label}</span>
              <span style={{ color: "#6b7684" }}>{c.count}</span>
            </div>
            <div className="rounded px-1.5 py-1 truncate" style={{ backgroundColor: "#1c2733", color: c.chipColor }}>
              {c.chip}
            </div>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function MockSheet() {
  return (
    <MockShell title="経費精算_7月.xlsx">
      <div className="font-mono">
        <div className="flex" style={{ color: "#8a95a3", borderBottom: "1px solid #1e2733" }}>
          <span className="w-4 flex-shrink-0" />
          <span className="flex-1 px-1">日付</span>
          <span className="flex-1 px-1">項目</span>
          <span className="px-1 text-right" style={{ width: 56 }}>金額</span>
        </div>
        <div className="flex" style={{ color: "#c2cad3" }}>
          <span className="w-4 flex-shrink-0" style={{ color: "#6b7684" }}>2</span>
          <span className="flex-1 px-1">7/02</span>
          <span className="flex-1 px-1">タクシー代</span>
          <span className="px-1 text-right" style={{ width: 56 }}>¥3,400</span>
        </div>
        <div className="flex rounded" style={{ color: "#f5f5f5", backgroundColor: "#1c3a63" }}>
          <span className="w-4 flex-shrink-0" style={{ color: "#9fb4cf" }}>9</span>
          <span className="flex-1 px-1" style={{ color: "#e8935a" }}>合計</span>
          <span className="flex-1 px-1" />
          <span className="px-1 text-right font-semibold" style={{ width: 56 }}>¥128,400</span>
        </div>
      </div>
    </MockShell>
  );
}

function MockDashboard() {
  const bars = [10, 16, 12, 22, 18, 28];
  return (
    <MockShell title="業務ダッシュボード">
      <div className="flex items-end gap-3">
        <div className="rounded px-2 py-1.5" style={{ backgroundColor: "#141d29" }}>
          <div style={{ color: "#8a95a3" }}>処理タスク</div>
          <div style={{ color: "#f5f5f5" }} className="text-sm font-semibold">128件</div>
        </div>
        <div className="rounded px-2 py-1.5" style={{ backgroundColor: "#141d29" }}>
          <div style={{ color: "#8a95a3" }}>浮いた時間</div>
          <div style={{ color: "#5b9bd5" }} className="text-sm font-semibold">42.5h</div>
        </div>
        <div className="flex items-end gap-1 ml-auto" style={{ height: 32 }}>
          {bars.map((h, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: h,
                borderRadius: 2,
                backgroundColor: i >= bars.length - 2 ? "#e8935a" : "#37475a",
                display: "inline-block",
              }}
            />
          ))}
        </div>
      </div>
    </MockShell>
  );
}

/* ---------- Feature rows ---------- */

const FEATURES: {
  n: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
  mock: React.ReactNode;
}[] = [
  { n: 1, icon: <IconDoc />, title: "AIが資料を直接読む", desc: "別画面を開かず、AIの横で資料を読み込ませられる", mock: <MockTerminal /> },
  { n: 2, icon: <IconTerminal />, title: "情報収集の時短に", desc: "これまでコピペしていた情報が、AIに直接見せられる", mock: <MockMail /> },
  { n: 3, icon: <IconUsers />, title: "PC不具合も診断", desc: "「/doctor」と打つだけで、AIがPC環境の不具合も見てくれる", mock: <MockBoard /> },
  { n: 4, icon: <IconTable />, title: "ほぼ会話だけで操作", desc: "専門知識がなくても、AIとの会話で作業を進められる", mock: <MockSheet /> },
  { n: 5, icon: <IconSparkles />, title: "Web検索もスムーズ", desc: "AIが最新情報をブラウザで検索し、要約して提示してくれる", mock: <MockDashboard /> },
];

/* ---------- Page ---------- */

export default function GuidePage() {
  return (
    <div className="flex justify-center">
      <div
        className="w-full max-w-2xl rounded-2xl px-6 py-8 sm:px-9 sm:py-10"
        style={{ backgroundColor: "#0f1620", border: "1px solid #1e2733", color: "#e8edf2" }}
      >
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
          Claude Code、<span style={{ color: "#e8935a" }}>ブラウザ内蔵</span>で調べ物
          <br className="hidden sm:block" />ラクに。
        </h1>

        {/* Badges + tools */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
            }
            label="無料版でOK"
          />
          <Badge
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label="コピペ不要"
          />
          <Badge
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" strokeLinecap="round" />
              </svg>
            }
            label="AIが直接確認"
          />

          <div className="flex items-center gap-2 ml-auto">
            <span style={{ color: "#8a95a3" }} className="text-[11px]">対応ツール例</span>
            <div className="flex items-center gap-1">
              <ToolLogo bg="#d97757"><span style={{ color: "#fff", fontSize: 13 }}>✳</span></ToolLogo>
              <ToolLogo bg="#10a37f"><span style={{ color: "#fff", fontSize: 12 }}>◎</span></ToolLogo>
              <ToolLogo bg="#3b6ef2"><span style={{ color: "#fff", fontSize: 12 }}>✦</span></ToolLogo>
              <ToolLogo bg="#0d0d0d"><span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>N</span></ToolLogo>
              <ToolLogo bg="#611f69"><span style={{ color: "#fff", fontSize: 12 }}>#</span></ToolLogo>
              <ToolLogo bg="#188038"><span style={{ color: "#fff", fontSize: 12 }}>▦</span></ToolLogo>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="mt-6 space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.n}
              className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(0,240px)] gap-3 rounded-xl p-3.5"
              style={{ backgroundColor: "#141d28", borderLeft: "3px solid #e8935a" }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex items-center justify-center rounded-md text-sm font-bold flex-shrink-0"
                  style={{ width: 34, height: 34, backgroundColor: "#2a1d13", color: "#e8935a", border: "1px solid #4a3116" }}
                >
                  {f.n}
                </span>
                <span className="flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h2 className="text-base font-bold leading-snug" style={{ color: "#f3f6f9" }}>{f.title}</h2>
                  <p className="text-[13px] leading-snug mt-0.5" style={{ color: "#9aa5b1" }}>{f.desc}</p>
                </div>
              </div>
              <div className="flex items-center">{f.mock}</div>
            </div>
          ))}
        </div>

        {/* Hint bar */}
        <div
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ backgroundColor: "#141d28", borderLeft: "3px solid #5b9bd5" }}
        >
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded"
            style={{ color: "#5b9bd5", border: "1px solid #2f4a68" }}
          >
            ヒント
          </span>
          <span className="text-sm" style={{ color: "#c7d0da" }}>
            「/doctor」でPC環境の不具合を診断！
          </span>
        </div>

        {/* CTA */}
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-5 py-4"
          style={{ backgroundColor: "#e8935a" }}
        >
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{ backgroundColor: "#1a1206", color: "#f5d9c2" }}
          >
            今日はこれだけ
          </span>
          <span className="text-lg font-bold" style={{ color: "#1a1206" }}>
            Claude Codeを開く
          </span>
          <span className="ml-auto text-sm font-bold whitespace-nowrap" style={{ color: "#3a2410" }}>
            → 情報収集が速くなる
          </span>
        </div>
      </div>
    </div>
  );
}
