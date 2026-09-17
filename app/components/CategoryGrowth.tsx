"use client";

import { useMemo, useState } from "react";
import type { Category, MonthKey } from "../report-types";
import { baht } from "../lib/format";

function GrowthCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
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
}: {
  categories: Category[];
  monthKeys: MonthKey[];
}) {
  const [idx, setIdx] = useState(monthKeys.length - 1);

  const rows = useMemo(() => {
    const list = categories.map((c) => {
      const value = c.series[idx] ?? 0;
      const prev = idx > 0 ? (c.series[idx - 1] ?? 0) : null;
      const mom = prev && prev !== 0 ? ((value - prev) / prev) * 100 : null;
      return { name: c.name, value, mom };
    });
    const total = list.reduce((s, r) => s + r.value, 0);
    return list
      .map((r) => ({ ...r, share: total ? (r.value / total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [categories, idx]);

  const monthTotal = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          การเติบโตรายหมวดสินค้า
        </h2>
        <select
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {monthKeys.map((m, i) => (
            <option key={m.key} value={i}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        หมวดจัดกลุ่มอัตโนมัติจากชื่อสินค้า · MoM = เทียบเดือนก่อนหน้า · ยอดรวมเดือนนี้{" "}
        {baht(monthTotal)}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">หมวด</th>
              <th className="px-2 py-2 text-right font-medium">ยอดขาย</th>
              <th className="px-2 py-2 text-right font-medium">สัดส่วน</th>
              <th className="px-2 py-2 text-right font-medium">MoM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                  {r.name}
                </td>
                <td className="px-2 py-2 text-right font-medium text-slate-700 dark:text-slate-200">
                  {baht(r.value)}
                </td>
                <td className="px-2 py-2 text-right text-slate-500 dark:text-slate-400">
                  {r.share.toFixed(1)}%
                </td>
                <td className="px-2 py-2 text-right">
                  <GrowthCell value={r.mom} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
