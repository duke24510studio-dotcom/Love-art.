import { useEffect, useMemo, useState } from "react";
import { drugs, drugById } from "./data";
import type { Category } from "./types";
import { DrugCard } from "./components/DrugCard";
import { DrugDetail } from "./components/DrugDetail";
import { InteractionChecker } from "./components/InteractionChecker";

type View = "search" | "checker" | "favorites";

const CATEGORIES: Category[] = ["内服", "注射・点滴", "外用", "点眼"];
const FAV_KEY = "kusuri-queen:favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function matches(query: string, haystack: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

const NAV_ITEMS: { view: View; label: string; icon: string }[] = [
  { view: "search", label: "検索", icon: "🔍" },
  { view: "checker", label: "相互作用", icon: "🔀" },
  { view: "favorites", label: "お気に入り", icon: "★" },
];

export default function App() {
  const [view, setView] = useState<View>("search");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "すべて">("すべて");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

  const filtered = useMemo(() => {
    let list = drugs;
    if (view === "favorites") list = list.filter((d) => favorites.includes(d.id));
    if (category !== "すべて") list = list.filter((d) => d.category === category);
    const q = query.trim();
    if (q) {
      list = list.filter((d) =>
        matches(
          q,
          [d.genericName, ...d.brandNames, d.kana, d.drugClass].join(" ")
        )
      );
    }
    return list;
  }, [view, query, category, favorites]);

  const selected = selectedId ? drugById.get(selectedId) : undefined;

  const goto = (v: View) => {
    setView(v);
    setSelectedId(null);
  };

  return (
    <div className="min-h-dvh lg:flex">
      {/* サイドバー(デスクトップ) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-queen-100 bg-white px-4 py-6 lg:flex lg:sticky lg:top-0 lg:h-dvh">
        <Logo />
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => goto(item.view)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                view === item.view && !selected
                  ? "bg-queen-600 text-white shadow-sm"
                  : "text-ink-soft hover:bg-queen-50 hover:text-queen-700"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {item.view === "favorites" && favorites.length > 0 && (
                <span className="ml-auto rounded-full bg-queen-100 px-2 py-0.5 text-xs font-bold text-queen-700">
                  {favorites.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-queen-50 p-3 text-xs leading-relaxed text-queen-900">
          本アプリは学習・参考用です。投与判断は必ず最新の添付文書と施設のプロトコル、医師・薬剤師の指示に従ってください。
        </div>
      </aside>

      {/* メイン */}
      <div className="flex-1 pb-24 lg:pb-8">
        {/* モバイルヘッダー */}
        <header className="border-b border-queen-100 bg-white px-4 py-3 lg:hidden">
          <Logo compact />
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-10">
          {selected ? (
            <DrugDetail
              drug={selected}
              isFavorite={favorites.includes(selected.id)}
              onBack={() => setSelectedId(null)}
              onToggleFavorite={() => toggleFavorite(selected.id)}
            />
          ) : view === "checker" ? (
            <InteractionChecker />
          ) : (
            <div className="mx-auto max-w-3xl">
              <h2 className="text-xl font-bold text-ink">
                {view === "favorites" ? "★ お気に入り" : "薬剤を検索"}
              </h2>

              <div className="mt-4">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="薬剤名・商品名・ひらがな・分類で検索(例:ろきそ、ラシックス、PPI)"
                  className="w-full rounded-xl border border-queen-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition placeholder:text-stone-400 focus:border-queen-500 focus:ring-2 focus:ring-queen-200"
                  autoComplete="off"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["すべて", ...CATEGORIES] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                      category === c
                        ? "bg-queen-600 text-white shadow-sm"
                        : "bg-white text-ink-soft ring-1 ring-queen-200 hover:bg-queen-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-ink-soft">
                {filtered.length}件 / 全{drugs.length}件
              </p>

              <div className="mt-3 grid gap-3">
                {filtered.map((d) => (
                  <DrugCard
                    key={d.id}
                    drug={d}
                    isFavorite={favorites.includes(d.id)}
                    onSelect={() => setSelectedId(d.id)}
                    onToggleFavorite={() => toggleFavorite(d.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="rounded-xl border border-dashed border-queen-200 bg-white p-8 text-center text-sm text-ink-soft">
                    {view === "favorites" && favorites.length === 0
                      ? "お気に入りはまだありません。検索画面で ☆ を押して追加できます。"
                      : "該当する薬剤が見つかりませんでした。別のキーワードでお試しください。"}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ボトムタブ(モバイル) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-queen-100 bg-white/95 backdrop-blur lg:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => goto(item.view)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-xs font-medium transition ${
              view === item.view && !selected
                ? "text-queen-600"
                : "text-stone-400"
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <div>
        <p className={`font-bold tracking-tight text-queen-700 ${compact ? "text-base" : "text-lg"}`}>
          クスリクイーン
        </p>
        {!compact && (
          <p className="text-[11px] text-ink-soft">看護師のための薬リファレンス</p>
        )}
      </div>
    </div>
  );
}
