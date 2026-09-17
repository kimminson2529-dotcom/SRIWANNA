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

const short = (s: string, n = 22) => (s.length > n ? s.slice(0, n) + "…" : s);
const compact = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function TopProductsChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        สินค้าขายดี 10 อันดับ (ตามยอดขาย)
      </h2>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7dcc6" opacity={0.4} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="#9a8778"
              tickFormatter={(v) => compact(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 11 }}
              stroke="#9a8778"
              tickFormatter={(v) => short(String(v))}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e7dcc6",
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" fill="#c9a227" radius={[0, 6, 6, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
