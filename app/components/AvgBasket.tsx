"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BasketSummary, BasketMonth } from "../report-types";
import { baht, num } from "../lib/format";

const yearOf = (key: string) => key.split("-")[0];

export default function AvgBasket({ basket }: { basket: BasketSummary }) {
  const [sel, setSel] = useState("all"); // branch
  const allMonths = basket.months;
  const years = useMemo(
    () => [...new Set(allMonths.map((m) => yearOf(m.key)))].sort(),
    [allMonths],
  );
  const [year, setYear] = useState(years[years.length - 1] ?? "");
  const [month, setMonth] = useState("all");

  // เดือนของสาขา/ทุกสาขาที่เลือก
  const sourceMonths: BasketMonth[] = useMemo(() => {
    if (sel === "all") return allMonths;
    return basket.branches.find((b) => b.code === sel)?.months ?? [];
  }, [basket, sel, allMonths]);

  const yearMonths = useMemo(
    () => sourceMonths.filter((m) => yearOf(m.key) === year),
    [sourceMonths, year],
  );

  const onYear = (y: string) => {
    setYear(y);
    setMonth("all");
  };
  const onBranch = (b: string) => {
    setSel(b);
    setMonth("all");
  };

  // MoM ของยอดเฉลี่ยต่อบิล (เทียบเดือนก่อนหน้าในลำดับข้อมูลของสาขาที่เลือก)
  const momOf = (key: string) => {
    const idx = sourceMonths.findIndex((x) => x.key === key);
    if (idx <= 0) return null;
    const prev = sourceMonths[idx - 1].avgBasket;
    const cur = sourceMonths[idx].avgBasket;
    return prev ? ((cur - prev) / prev) * 100 : null;
  };
  const MoM = ({ v }: { v: number | null }) => {
    if (v === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
    const up = v > 0;
    const down = v < 0;
    return (
      <span
        className={`font-semibold ${up ? "text-[#8e1538] dark:text-[#e6b3c1]" : down ? "text-red-500 dark:text-red-400" : "text-slate-400"}`}
      >
        {up ? "▲ +" : down ? "▼ " : ""}
        {v.toFixed(1)}%
      </span>
    );
  };

  // แถวที่แสดง + ตัวเลขใหญ่
  const shown =
    month === "all" ? yearMonths : yearMonths.filter((m) => m.key === month);
  const sumBills = shown.reduce((s, m) => s + m.bills, 0);
  const sumValue = shown.reduce((s, m) => s + m.billTotal, 0);
  const bigAvg = sumBills ? sumValue / sumBills : 0;

  const branchLabel =
    sel === "all"
      ? "ทุกสาขา"
      : `${sel} ${basket.branches.find((b) => b.code === sel)?.name ?? ""}`;
  const chartData = yearMonths.map((m) => ({
    label: m.label.replace(` ${year}`, ""),
    key: m.key,
    avg: m.avgBasket,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          ยอดขายเฉลี่ยต่อบิล (AVG Basket)
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={sel}
            onChange={(e) => onBranch(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b8860b] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">ทุกสาขา</option>
            {basket.branches.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} {b.name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => onYear(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b8860b] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                ปี {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b8860b] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">ทั้งปี</option>
            {yearMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          {baht(bigAvg)}
          <span className="ml-1 text-sm font-normal text-slate-400">/บิล</span>
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {branchLabel}
        </span>
        <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {num(sumBills)} บิล
        </span>
      </div>

      {basket.branches.length <= 1 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          ขณะนี้มีข้อมูลรายบิลบางสาขา/บางเดือนเท่านั้น — เพิ่มไฟล์รายบิลในโฟลเดอร์
          Data/รายงานการขายตามบิล เพื่อดูครบ
        </p>
      )}

      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7dcc6" opacity={0.4} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9a8778" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9a8778"
              width={44}
              tickFormatter={(v) => new Intl.NumberFormat("th-TH").format(v)}
            />
            <Tooltip
              formatter={(v) => [baht(Number(v)), "เฉลี่ย/บิล"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e7dcc6", fontSize: 13 }}
            />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((d) => (
                <Cell
                  key={d.key}
                  fill={month !== "all" && d.key !== month ? "#ecd9b0" : "#d4a017"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="py-2 font-medium">เดือน</th>
              <th className="py-2 text-right font-medium">จำนวนบิล</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">
                ยอดขาย
              </th>
              <th className="py-2 text-right font-medium">เฉลี่ย/บิล</th>
              <th className="py-2 text-right font-medium">MoM</th>
            </tr>
          </thead>
          <tbody>
            {yearMonths.map((m) => (
              <tr
                key={m.key}
                className={`border-t border-slate-100 dark:border-slate-800 ${
                  month === m.key ? "bg-amber-50 dark:bg-amber-950/30" : ""
                }`}
              >
                <td className="py-2 text-slate-700 dark:text-slate-200">{m.label}</td>
                <td className="py-2 text-right text-slate-500 dark:text-slate-400">
                  {num(m.bills)}
                </td>
                <td className="hidden py-2 text-right text-slate-500 dark:text-slate-400 sm:table-cell">
                  {baht(m.billTotal)}
                </td>
                <td className="py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                  {baht(m.avgBasket)}
                </td>
                <td className="py-2 text-right">
                  <MoM v={momOf(m.key)} />
                </td>
              </tr>
            ))}
            {yearMonths.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  ไม่มีข้อมูลบิลในมุมมองนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        AVG Basket Size = ยอดขายรวม ÷ จำนวนบิล (จากรายงานการขายตามบิล) · แยกตามเดือน
      </p>
    </div>
  );
}
