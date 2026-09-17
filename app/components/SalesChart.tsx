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

export type ChartPoint = { label: string; total: number };

export default function SalesChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700">
        ยังไม่มีข้อมูลสำหรับแสดงกราฟ
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        ยอดขายรายวัน
      </h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7dcc6" opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#9a8778"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9a8778"
              width={70}
              tickFormatter={(v) => new Intl.NumberFormat("th-TH").format(v)}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e7dcc6",
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="total"
              fill="#8e1538"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
