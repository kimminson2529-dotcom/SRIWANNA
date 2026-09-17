import type { Category, MonthKey } from "../report-types";
import { baht } from "../lib/format";

function pct(a: number, b: number | null) {
  if (b === null || b === 0) return null;
  return ((a - b) / b) * 100;
}

function GrowthCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  const up = value > 0;
  const down = value < 0;
  const color = up
    ? "text-emerald-600 dark:text-emerald-400"
    : down
      ? "text-red-500 dark:text-red-400"
      : "text-slate-400";
  return (
    <span className={`font-semibold ${color}`}>
      {up ? "▲ +" : down ? "▼ " : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function CategoryGrowth({
  categories,
  monthKeys,
  grandValue,
}: {
  categories: Category[];
  monthKeys: MonthKey[];
  grandValue: number;
}) {
  const lastLabel = monthKeys[monthKeys.length - 1]?.label ?? "";
  const prevLabel = monthKeys[monthKeys.length - 2]?.label ?? "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
        การเติบโตรายหมวดสินค้า
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        หมวดจัดกลุ่มอัตโนมัติจากชื่อสินค้า · MoM = {lastLabel} เทียบ {prevLabel}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">หมวด</th>
              <th className="px-2 py-2 text-right font-medium">ยอดขายรวม</th>
              <th className="px-2 py-2 text-right font-medium">สัดส่วน</th>
              <th className="px-2 py-2 text-right font-medium">MoM ล่าสุด</th>
              <th className="px-2 py-2 text-right font-medium">แนวโน้ม (เดือนแรก→ล่าสุด)</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const n = c.series.length;
              const last = c.series[n - 1] ?? 0;
              const prev = c.series[n - 2] ?? null;
              const first = c.series[0] ?? null;
              const mom = pct(last, prev);
              const trend = pct(last, first);
              const share = grandValue ? (c.total / grandValue) * 100 : 0;
              return (
                <tr
                  key={c.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                    {c.name}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700 dark:text-slate-200">
                    {baht(c.total)}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-500 dark:text-slate-400">
                    {share.toFixed(1)}%
                  </td>
                  <td className="px-2 py-2 text-right">
                    <GrowthCell value={mom} />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <GrowthCell value={trend} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
