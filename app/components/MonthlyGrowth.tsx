"use client";

import { useMemo, useState } from "react";
import type { ReportMonth } from "../report-types";
import { baht } from "../lib/format";

function pctText(pct: number | null) {
  if (pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export default function MonthlyGrowth({ months }: { months: ReportMonth[] }) {
  const [year, setYear] = useState("all");

  const years = useMemo(
    () =>
      [...new Set(months.map((m) => m.be))]
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b),
    [months],
  );

  // คำนวณ MoM จากลำดับเต็ม (ม.ค. ปีถัดไปเทียบ ธ.ค. ปีก่อน) แล้วค่อยกรองปีที่แสดง
  const rows = useMemo(() => {
    const all = months.map((m, i) => {
      const prev = i > 0 ? months[i - 1].totalValue : null;
      const diff = prev !== null ? m.totalValue - prev : null;
      const pct = prev && prev !== 0 ? (diff! / prev) * 100 : null;
      return { be: m.be, label: m.label, value: m.totalValue, diff, pct };
    });
    return year === "all"
      ? all
      : all.filter((r) => String(r.be) === year);
  }, [months, year]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          การเติบโตเทียบเดือนก่อนหน้า (MoM)
        </h2>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">ทุกปี</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              ปี {y}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="py-2 font-medium">เดือน</th>
              <th className="py-2 text-right font-medium">ยอดขาย</th>
              <th className="py-2 text-right font-medium">เปลี่ยนแปลง</th>
              <th className="py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = (r.pct ?? 0) > 0;
              const down = (r.pct ?? 0) < 0;
              const color = up
                ? "text-emerald-600 dark:text-emerald-400"
                : down
                  ? "text-red-500 dark:text-red-400"
                  : "text-slate-400";
              const newYear = i > 0 && r.be !== rows[i - 1].be;
              return (
                <tr
                  key={r.label}
                  className={`border-t ${newYear ? "border-slate-300 dark:border-slate-600" : "border-slate-100 dark:border-slate-800"}`}
                >
                  <td className="py-2 text-slate-700 dark:text-slate-200">
                    {r.label}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                    {baht(r.value)}
                  </td>
                  <td className={`py-2 text-right ${color}`}>
                    {r.diff === null
                      ? "—"
                      : (r.diff > 0 ? "+" : "") + baht(r.diff)}
                  </td>
                  <td className={`py-2 text-right font-semibold ${color}`}>
                    {r.pct !== null && (
                      <span aria-hidden className="mr-0.5">
                        {up ? "▲" : down ? "▼" : ""}
                      </span>
                    )}
                    {pctText(r.pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        % = (ยอดเดือนนี้ − ยอดเดือนก่อน) ÷ ยอดเดือนก่อน · ม.ค. เทียบ ธ.ค. ปีก่อน
      </p>
    </div>
  );
}
