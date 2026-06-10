import type { Category, Severity } from "../types";

export function CategoryBadge({ category }: { category: Category }) {
  const styles: Record<Category, string> = {
    内服: "bg-amber-100 text-amber-800",
    "注射・点滴": "bg-sky-100 text-sky-800",
    外用: "bg-emerald-100 text-emerald-800",
    点眼: "bg-violet-100 text-violet-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[category]}`}
    >
      {category}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    禁忌: "bg-red-600 text-white",
    重要: "bg-queen-600 text-white",
    注意: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${styles[severity]}`}
    >
      {severity}
    </span>
  );
}

export function HighAlertBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
      ⚠ ハイリスク薬
    </span>
  );
}
