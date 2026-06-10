import { useMemo, useState } from "react";
import { drugs, drugById } from "../data";
import type { Drug, Interaction } from "../types";
import { SeverityBadge } from "./Badges";

interface Hit {
  source: Drug;
  interaction: Interaction;
}

/** drug A の相互作用リストから drug B に該当するものを探す */
function findHits(a: Drug, b: Drug): Hit[] {
  const bNames = [
    b.genericName,
    ...b.brandNames,
    b.drugClass,
    b.kana,
    b.id,
  ]
    .join(" ")
    .toLowerCase();
  return a.interactions
    .filter((ix) =>
      ix.keywords.some((kw) => bNames.includes(kw.toLowerCase()))
    )
    .map((interaction) => ({ source: a, interaction }));
}

function DrugSelect({
  label,
  value,
  exclude,
  onChange,
}: {
  label: string;
  value: string;
  exclude?: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-queen-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-queen-500 focus:ring-2 focus:ring-queen-200"
      >
        <option value="">— 薬剤を選択 —</option>
        {drugs
          .filter((d) => d.id !== exclude)
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.genericName}({d.brandNames[0]})
            </option>
          ))}
      </select>
    </label>
  );
}

export function InteractionChecker() {
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const drugA = idA ? drugById.get(idA) : undefined;
  const drugB = idB ? drugById.get(idB) : undefined;

  const hits = useMemo(() => {
    if (!drugA || !drugB) return [];
    return [...findHits(drugA, drugB), ...findHits(drugB, drugA)];
  }, [drugA, drugB]);

  const bothIv = drugA?.category === "注射・点滴" && drugB?.category === "注射・点滴";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="rounded-2xl border border-queen-200 bg-gradient-to-br from-queen-50 to-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink">🔀 相互作用チェッカー</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          2つの薬剤を選ぶと、このアプリに収録された相互作用・配合変化情報を照合します。
          収録外の組み合わせは「該当なし」と表示されますが、安全を保証するものではありません。
          必ず添付文書・薬剤師に確認してください。
        </p>
      </header>

      <div className="mt-4 grid gap-4 rounded-xl border border-queen-100 bg-white p-5 shadow-sm sm:grid-cols-2">
        <DrugSelect label="薬剤 1" value={idA} exclude={idB} onChange={setIdA} />
        <DrugSelect label="薬剤 2" value={idB} exclude={idA} onChange={setIdB} />
      </div>

      {drugA && drugB && (
        <div className="mt-4 space-y-4">
          {hits.length > 0 ? (
            hits.map(({ source, interaction }, i) => (
              <div
                key={`${source.id}-${i}`}
                className="rounded-xl border border-queen-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={interaction.severity} />
                  <span className="text-sm font-bold text-ink">
                    {source.genericName} × {interaction.target}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{interaction.effect}</p>
                <p className="mt-1.5 text-sm font-medium text-queen-800">
                  ▶ 対応:{interaction.action}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              この2剤について、収録データ内に該当する相互作用は見つかりませんでした。
              <span className="font-semibold">
                (未収録の相互作用が存在する可能性があります。投与前に添付文書・薬剤師へ確認を)
              </span>
            </div>
          )}

          {bothIv && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
              <h3 className="text-sm font-bold text-ink">💧 配合変化メモ(注射・点滴同士)</h3>
              {[drugA, drugB].map(
                (d) =>
                  d.iv && (
                    <div key={d.id} className="mt-3">
                      <p className="text-sm font-semibold text-sky-900">{d.genericName}</p>
                      <ul className="mt-1 space-y-1 text-sm text-ink-soft">
                        {d.iv.incompatible.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
              <p className="mt-3 text-xs text-sky-800">
                同一ルートからの側管投与は、前後の生食フラッシュや別ルート確保を含め施設の手順に従ってください。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
