import type { Drug } from "../types";
import { CategoryBadge, HighAlertBadge } from "./Badges";

interface Props {
  drug: Drug;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export function DrugCard({ drug, isFavorite, onSelect, onToggleFavorite }: Props) {
  return (
    <div
      className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-queen-100 bg-white p-4 shadow-sm transition hover:border-queen-300 hover:shadow-md"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={drug.category} />
          {drug.highAlert && <HighAlertBadge />}
        </div>
        <h3 className="mt-2 truncate text-base font-bold text-ink group-hover:text-queen-700">
          {drug.genericName}
        </h3>
        <p className="mt-0.5 truncate text-sm text-ink-soft">
          {drug.brandNames.join("・")}
          <span className="mx-1.5 text-queen-300">|</span>
          {drug.drugClass}
        </p>
      </div>
      <button
        aria-label={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
        className={`shrink-0 rounded-full p-2 text-lg leading-none transition ${
          isFavorite
            ? "text-queen-500"
            : "text-stone-300 hover:text-queen-400"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </div>
  );
}
