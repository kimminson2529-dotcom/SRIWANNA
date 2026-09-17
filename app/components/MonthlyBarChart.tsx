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
import { baht } from "../lib/format";

const compact = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function MonthlyBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        ยอดขายรายเดือน (บาท)
      </h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
              width={56}
              tickFormatter={(v) => compact(Number(v))}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
