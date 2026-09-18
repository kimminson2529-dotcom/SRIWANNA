"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { baht } from "../lib/format";

const compact = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(v);

// สีแยกตามปี
const COLORS: Record<number, string> = { 2568: "#8e1538", 2569: "#c9a227" };
const PARTIAL = "#e0a458"; // เดือนปัจจุบัน (ยังไม่ครบเดือน)
const colorFor = (be: number | null, partial?: boolean) =>
  partial ? PARTIAL : (be && COLORS[be]) || "#9a8778";

export default function MonthlyBarChart({
  data,
}: {
  data: { label: string; value: number; be: number | null; partial?: boolean }[];
}) {
  const years = [...new Set(data.filter((d) => !d.partial).map((d) => d.be))].filter(
    (y): y is number => y !== null,
  );
  const hasPartial = data.some((d) => d.partial);
  // ป้ายเดือนแรกของแต่ละปี (ยกเว้นปีแรก) สำหรับเส้นแบ่ง
  const boundaries: string[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].be !== data[i - 1].be) boundaries.push(data[i].label);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          ยอดขายรายเดือน (บาท)
        </h2>
        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
          {years.map((y) => (
            <span key={y} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: colorFor(y) }}
              />
              ปี {y}
            </span>
          ))}
          {hasPartial && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: PARTIAL }}
              />
              เดือนปัจจุบัน*
            </span>
          )}
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7dcc6" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9a8778" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9a8778"
              width={56}
              tickFormatter={(v) => compact(Number(v))}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "ยอดขาย"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e7dcc6",
                fontSize: 13,
              }}
            />
            {boundaries.map((b) => (
              <ReferenceLine
                key={b}
                x={b}
                stroke="#9a8778"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ))}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((d, i) => (
                <Cell key={i} fill={colorFor(d.be, d.partial)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {hasPartial && (
        <p className="mt-2 text-xs text-slate-400">
          * เดือนปัจจุบันเป็นข้อมูลที่ยังไม่ครบเดือน (ยอดจริงถึงปัจจุบัน)
        </p>
      )}
    </div>
  );
}
