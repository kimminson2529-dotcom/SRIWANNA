"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BasketSummary, BasketMonth } from "../report-types";
import { baht, num } from "../lib/format";

export default function AvgBasket({ basket }: { basket: BasketSummary }) {
  const [sel, setSel] = useState("all");

  const view = useMemo(() => {
    if (sel === "all") {
      return {
        months: basket.months,
        bills: basket.totalBills,
        value: basket.totalValue,
        avg: basket.avgBasket,
        label: "ทุกสาขา",
      };
    }
    const b = basket.branches.find((x) => x.code === sel);
    return {
      months: b?.months ?? [],
      bills: b?.bills ?? 0,
      value: b?.value ?? 0,
      avg: b?.avgBasket ?? 0,
      label: b ? `${b.code} ${b.name}` : sel,
    };
  }, [basket, sel]);

  const data = view.months.map((m: BasketMonth) => ({
    label: m.label,
    avg: m.avgBasket,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          ยอดขายเฉลี่ยต่อบิล (AVG Basket Size)
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">ทุกสาขา</option>
            {basket.branches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} {b.name}
              </option>
            ))}
          </select>
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {baht(view.avg)}
            </span>
            <span className="ml-1 text-sm text-slate-400">/บิล</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {view.label}
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {num(view.bills)} บิล
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          ยอดรวม {baht(view.value)}
        </span>
      </div>

      {basket.branches.length <= 1 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          ขณะนี้มีข้อมูลรายบิลของสาขา {basket.scope} เท่านั้น — เพิ่มไฟล์รายบิลของสาขาอื่นในโฟลเดอร์
          Data/รายงานการขายตามบิล เพื่อดูครบทุกสาขา
        </p>
      )}

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
              width={48}
              tickFormatter={(v) => new Intl.NumberFormat("th-TH").format(v)}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "เฉลี่ย/บิล"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
            <Bar dataKey="avg" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="py-2 font-medium">เดือน</th>
              <th className="py-2 text-right font-medium">จำนวนบิล</th>
              <th className="py-2 text-right font-medium">ยอดขาย</th>
              <th className="py-2 text-right font-medium">เฉลี่ย/บิล</th>
            </tr>
          </thead>
          <tbody>
            {view.months.map((m: BasketMonth) => (
              <tr key={m.key} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-700 dark:text-slate-200">{m.label}</td>
                <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                  {num(m.bills)}
                </td>
                <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                  {baht(m.billTotal)}
                </td>
                <td className="py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                  {baht(m.avgBasket)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        AVG Basket Size = ยอดขายรวม ÷ จำนวนบิล (จากรายงานการขายตามบิล)
      </p>
    </div>
  );
}
