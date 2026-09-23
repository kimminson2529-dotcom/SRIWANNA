"use client";

import { useMemo, useState } from "react";
import type { BrandSeries, MonthKey } from "../report-types";
import { baht, num } from "../lib/format";

const yearOf = (key: string) => key.split("-")[0];

function MoM({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  const up = value > 0;
  const down = value < 0;
  const color = up
    ? "text-[#8e1538] dark:text-[#e6b3c1]"
    : down
      ? "text-red-500 dark:text-red-400"
      : "text-slate-400";
  return (
    <span className={`font-semibold ${color}`}>
      {up ? "▲ +" : down ? "▼ " : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function BrandBreakdown({
  brandSeries,
  brandCount,
  monthKeys,
}: {
  brandSeries: BrandSeries[];
  brandCount: number;
  monthKeys: MonthKey[];
}) {
  const years = useMemo(
    () => [...new Set(monthKeys.map((m) => yearOf(m.key)))].sort(),
    [monthKeys],
  );
  const [year, setYear] = useState(years[years.length - 1]);
  const yearMonths = useMemo(
    () => monthKeys.map((m, i) => ({ ...m, i })).filter((m) => yearOf(m.key) === year),
    [monthKeys, year],
  );
  const [idx, setIdx] = useState(
    yearMonths[yearMonths.length - 1]?.i ?? monthKeys.length - 1,
  );
  const onYear = (y: string) => {
    setYear(y);
    const ms = monthKeys.map((m, i) => ({ key: m.key, i })).filter((m) => yearOf(m.key) === y);
    setIdx(ms[ms.length - 1]?.i ?? 0);
  };

  const rows = useMemo(() => {
    const preOther = brandSeries.find((b) => b.name.startsWith("อื่นๆ"));
    const named = brandSeries.filter((b) => !b.name.startsWith("อื่นๆ"));
    const withVals = named
      .map((b) => ({
        name: b.name,
        value: b.series[idx] ?? 0,
        prev: idx > 0 ? (b.series[idx - 1] ?? 0) : null,
      }))
      .sort((a, b) => b.value - a.value);
    const top = withVals.slice(0, 15);
    const restNamed = withVals.slice(15);
    const otherValue =
      restNamed.reduce((s, b) => s + b.value, 0) + (preOther ? preOther.series[idx] : 0);
    const otherPrev =
      idx > 0
        ? restNamed.reduce((s, b) => s + (b.prev ?? 0), 0) +
          (preOther ? (preOther.series[idx - 1] ?? 0) : 0)
        : null;
    const list = [...top, { name: "อื่นๆ", value: otherValue, prev: otherPrev }];
    const total = list.reduce((s, r) => s + r.value, 0);
    return list.map((r) => ({
      ...r,
      share: total ? (r.value / total) * 100 : 0,
      mom: r.prev && r.prev !== 0 ? ((r.value - r.prev) / r.prev) * 100 : null,
    }));
  }, [brandSeries, idx]);

  const monthTotal = rows.reduce((s, r) => s + r.value, 0);
  const maxShare = Math.max(...rows.map((r) => r.share), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          ยอดขายแยกตามแบรนด์
        </h2>
        <div className="flex gap-2">
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
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#b8860b] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {yearMonths.map((m) => (
              <option key={m.key} value={m.i}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        15 อันดับแรก (จาก {num(brandCount)} แบรนด์) · MoM = เทียบเดือนก่อน · ยอดรวมเดือนนี้{" "}
        {baht(monthTotal)}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">แบรนด์</th>
              <th className="px-2 py-2 text-right font-medium">ยอดขาย</th>
              <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                สัดส่วน
              </th>
              <th className="px-2 py-2 text-right font-medium">MoM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const other = r.name === "อื่นๆ";
              return (
                <tr
                  key={r.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-2 py-2 text-slate-400">{other ? "" : i + 1}</td>
                  <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                    {other ? (
                      <span className="text-slate-500 dark:text-slate-400">อื่นๆ</span>
                    ) : (
                      r.name
                    )}
                    <span className="ml-2 text-xs text-slate-400 sm:hidden">
                      {r.share.toFixed(1)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right font-semibold text-[#8e1538] dark:text-[#e6b3c1]">
                    {baht(r.value)}
                  </td>
                  <td className="hidden px-2 py-2 text-right sm:table-cell">
                    <div className="flex items-center justify-end gap-2">
                      <span className="w-12 text-right text-slate-600 dark:text-slate-300">
                        {r.share.toFixed(1)}%
                      </span>
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <span
                          className="block h-full rounded-full bg-[#c9a227]"
                          style={{ width: `${(r.share / maxShare) * 100}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <MoM value={r.mom} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
