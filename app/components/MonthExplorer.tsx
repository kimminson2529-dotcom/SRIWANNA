"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReportMonth, ReportBranch, ReportProduct } from "../report-types";
import { baht, num } from "../lib/format";

type MonthFile = {
  key: string;
  label: string;
  totalValue: number;
  products: ReportProduct[];
};

export default function MonthExplorer({
  months,
  branches,
}: {
  months: ReportMonth[];
  branches: ReportBranch[];
}) {
  const [key, setKey] = useState(months[months.length - 1]?.key ?? "");
  const [branch, setBranch] = useState("all");
  const [q, setQ] = useState("");
  const [data, setData] = useState<MonthFile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    setLoading(true);
    fetch(`/monthly/${key}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (alive) setData(json);
      })
      .catch(() => {
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const items = useMemo(() => {
    if (!data) return [];
    return data.products
      .map((p) => {
        if (branch === "all") {
          return { code: p.code, name: p.name, unit: p.unit, qty: p.qty, value: p.value };
        }
        const b = p.byBranch?.[branch];
        if (!b || b.value === 0) return null;
        return { code: p.code, name: p.name, unit: p.unit, qty: b.qty, value: b.value };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.value - a.value);
  }, [data, branch]);

  const totalValue = useMemo(
    () => items.reduce((s, p) => s + p.value, 0),
    [items],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term
      ? items.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term),
        )
      : items;
  }, [items, q]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          รายละเอียดรายเดือน
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} {b.name}
              </option>
            ))}
          </select>
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
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ยอดขาย {baht(totalValue)}
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {num(items.length)} รายการ
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {branch === "all"
            ? "ทุกสาขา"
            : branches.find((b) => b.code === branch)?.name ?? branch}
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
              <th className="px-3 py-2 text-right font-medium">สัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  กำลังโหลด…
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((p, i) => {
                const pct = totalValue ? (p.value / totalValue) * 100 : 0;
                return (
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
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 sm:block">
                          <span
                            className="block h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  ไม่พบสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        สัดส่วน (Sales Contribution) = ยอดขายสินค้า ÷ ยอดขายรวมของมุมมองที่เลือก
      </p>
    </div>
  );
}
