import type { Drug } from "../types";
import { CategoryBadge, HighAlertBadge, SeverityBadge } from "./Badges";

interface Props {
  drug: Drug;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}

function Section({
  title,
  icon,
  children,
  tone = "default",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  tone?: "default" | "danger" | "info";
}) {
  const toneStyles = {
    default: "border-queen-100 bg-white",
    danger: "border-red-200 bg-red-50/60",
    info: "border-sky-200 bg-sky-50/60",
  } as const;
  return (
    <section className={`rounded-xl border p-4 shadow-sm ${toneStyles[tone]}`}>
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-ink">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-queen-400" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DrugDetail({ drug, isFavorite, onBack, onToggleFavorite }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-queen-700 transition hover:bg-queen-100"
        >
          ← 一覧に戻る
        </button>
        <button
          onClick={onToggleFavorite}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            isFavorite
              ? "bg-queen-100 text-queen-700"
              : "text-ink-soft hover:bg-queen-50"
          }`}
        >
          {isFavorite ? "★ お気に入り済み" : "☆ お気に入りに追加"}
        </button>
      </div>

      <header className="rounded-2xl border border-queen-200 bg-gradient-to-br from-queen-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={drug.category} />
          {drug.highAlert && <HighAlertBadge />}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-ink">{drug.genericName}</h2>
        <p className="mt-1 text-base text-queen-700">
          {drug.brandNames.map((b) => `「${b}」`).join(" ")}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{drug.drugClass}</p>
      </header>

      <div className="mt-4 grid gap-4">
        <Section title="効能・効果" icon="🎯">
          <Bullets items={drug.indications} />
        </Section>

        <Section title="よくある副作用" icon="💊">
          <Bullets items={drug.commonSideEffects} />
        </Section>

        <Section title="重大な副作用(初期症状に注意)" icon="🚨" tone="danger">
          <Bullets items={drug.seriousSideEffects} />
        </Section>

        <Section title="禁忌" icon="⛔" tone="danger">
          <Bullets items={drug.contraindications} />
        </Section>

        {drug.interactions.length > 0 && (
          <Section title="相互作用・飲み合わせ" icon="🔀">
            <div className="space-y-3">
              {drug.interactions.map((ix) => (
                <div
                  key={ix.target}
                  className="rounded-lg border border-queen-100 bg-queen-50/50 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={ix.severity} />
                    <span className="font-semibold text-ink">{ix.target}</span>
                  </div>
                  <p className="mt-1.5">{ix.effect}</p>
                  <p className="mt-1 font-medium text-queen-800">
                    ▶ 対応:{ix.action}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {drug.iv && (
          <Section title="点滴・配合変化(IVルール)" icon="💧" tone="info">
            {drug.iv.incompatible.length > 0 && (
              <>
                <p className="font-semibold text-ink">配合に注意する薬剤</p>
                <div className="mt-1.5 mb-3">
                  <Bullets items={drug.iv.incompatible} />
                </div>
              </>
            )}
            <p className="font-semibold text-ink">投与ルール</p>
            <div className="mt-1.5">
              <Bullets items={drug.iv.rules} />
            </div>
          </Section>
        )}

        <Section title="使用上の注意" icon="📋">
          <Bullets items={drug.precautions} />
        </Section>

        <Section title="看護のポイント" icon="🩺">
          <Bullets items={drug.nursingPoints} />
        </Section>
      </div>
    </div>
  );
}
