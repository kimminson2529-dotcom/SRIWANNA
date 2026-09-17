"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { baht, num } from "../lib/format";
import type { ReportBranch } from "../report-types";

const compact = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function BranchChart({ branches }: { branches: ReportBranch[] }) {
  const data = branches.map((b) => ({ name: b.name || b.code, value: b.value, qty: b.qty }));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        ยอดขายตามสาขา
      </h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              tickFormatter={(v) => compact(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="py-2 font-medium">สาขา</th>
              <th className="py-2 text-right font-medium">จำนวน</th>
              <th className="py-2 text-right font-medium">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.code} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 text-slate-700 dark:text-slate-200">
                  <span className="text-slate-400">{b.code}</span> {b.name}
                </td>
                <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                  {num(b.qty)}
                </td>
                <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {baht(b.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
