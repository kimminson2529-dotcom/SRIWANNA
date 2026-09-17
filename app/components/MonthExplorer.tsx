"use client";

import { useMemo, useState } from "react";
import type { ReportMonth } from "../report-types";
import { baht, num } from "../lib/format";

export default function MonthExplorer({ months }: { months: ReportMonth[] }) {
  const [key, setKey] = useState(months[months.length - 1]?.key ?? "");
  const [q, setQ] = useState("");

  const month = useMemo(
    () => months.find((m) => m.key === key) ?? months[0],
    [months, key],
  );

  const rows = useMemo(() => {
    if (!month) return [];
    const term = q.trim().toLowerCase();
    return term
      ? month.products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term),
        )
      : month.products;
  }, [month, q]);

  if (!month) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          รายละเอียดรายเดือน
        </h2>
        <select
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {months.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ยอดขาย {baht(month.totalValue)}
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {num(month.totalQty)} หน่วย
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {num(month.productCount)} รายการ · {month.branchCount} สาขา
        </span>
      </div>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาสินค้า / รหัส…"
        className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">สินค้า</th>
              <th className="px-3 py-2 text-right font-medium">จำนวน</th>
              <th className="px-3 py-2 text-right font-medium">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.code + i}
                className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                  {p.name}
                  <span className="ml-1 text-xs text-slate-400">{p.code}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-500 dark:text-slate-400">
                  {num(p.qty)} {p.unit}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {baht(p.value)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  ไม่พบสินค้าที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
