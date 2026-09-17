"use client";

import { useMemo, useState } from "react";
import { baht, num } from "../lib/format";

type BranchInfo = { code: string; name: string; value: number };
type MonthMeta = {
  key: string;
  label: string;
  order: number;
  be: number | null;
  days: number;
  totalValue: number;
};
type Stat = { value: number; qty: number };
type BillStat = { bills: number; avg: number };

export type BranchComparisonData = {
  branches: BranchInfo[];
  monthsMeta: MonthMeta[];
  monthlyBranch: Record<string, Record<string, Stat>>;
  basketMB: Record<string, Record<string, BillStat>>;
  basketAll: Record<string, BillStat>;
  periodDays: number;
  grandValue: number;
};

type Row = {
  code: string;
  name: string;
  value: number;
  share: number;
  perDay: number;
  bills: number | null;
  basket: number | null;
  growth: number | null;
};

function Growth({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  const up = pct > 0;
  const down = pct < 0;
  const color = up
    ? "text-emerald-600 dark:text-emerald-400"
    : down
      ? "text-red-500 dark:text-red-400"
      : "text-slate-400";
  return (
    <span className={`font-semibold ${color}`}>
      {up ? "▲ +" : down ? "▼ " : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function BranchComparison({ data }: { data: BranchComparisonData }) {
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");

  const nameOf = useMemo(
    () => Object.fromEntries(data.branches.map((b) => [b.code, b.name])),
    [data.branches],
  );
  const years = useMemo(
    () =>
      [...new Set(data.monthsMeta.map((m) => m.be))]
        .filter((y): y is number => y !== null)
        .sort((a, b) => a - b),
    [data.monthsMeta],
  );
  const yearMonths = useMemo(
    () =>
      year === "all"
        ? []
        : data.monthsMeta
            .filter((m) => String(m.be) === year)
            .sort((a, b) => a.order - b.order),
    [data.monthsMeta, year],
  );

  const onYear = (y: string) => {
    setYear(y);
    setMonth("all");
  };

  const rows: Row[] = useMemo(() => {
    // ---- ทุกปี รวมทั้งช่วง ----
    if (year === "all") {
      const meta = data.monthsMeta;
      const lastKey = meta[meta.length - 1]?.key;
      const prevKey = meta[meta.length - 2]?.key;
      return data.branches
        .map((b) => {
          const last = data.monthlyBranch[lastKey]?.[b.code]?.value ?? 0;
          const prev = data.monthlyBranch[prevKey]?.[b.code]?.value ?? 0;
          const bk = data.basketAll[b.code];
          return {
            code: b.code,
            name: b.name,
            value: b.value,
            share: data.grandValue ? (b.value / data.grandValue) * 100 : 0,
            perDay: data.periodDays ? b.value / data.periodDays : 0,
            bills: bk ? bk.bills : null,
            basket: bk ? bk.avg : null,
            growth: prev ? ((last - prev) / prev) * 100 : null,
          };
        })
        .sort((a, b) => b.value - a.value);
    }

    // ---- เลือกเดือนเดียวในปีนั้น ----
    if (month !== "all") {
      const idx = data.monthsMeta.findIndex((m) => m.key === month);
      const meta = data.monthsMeta[idx];
      if (!meta) return [];
      const prevKey = data.monthsMeta[idx - 1]?.key;
      const perBranch = data.monthlyBranch[month] ?? {};
      return Object.entries(perBranch)
        .map(([code, s]) => {
          const prev = prevKey
            ? (data.monthlyBranch[prevKey]?.[code]?.value ?? null)
            : null;
          const bk = data.basketMB[month]?.[code];
          return {
            code,
            name: nameOf[code] ?? code,
            value: s.value,
            share: meta.totalValue ? (s.value / meta.totalValue) * 100 : 0,
            perDay: meta.days ? s.value / meta.days : 0,
            bills: bk ? bk.bills : null,
            basket: bk ? bk.avg : null,
            growth: prev && prev !== 0 ? ((s.value - prev) / prev) * 100 : null,
          };
        })
        .sort((a, b) => b.value - a.value);
    }

    // ---- ทั้งปีที่เลือก (รวมทุกเดือนในปี) ----
    const keys = yearMonths.map((m) => m.key);
    const yearTotal = yearMonths.reduce((s, m) => s + m.totalValue, 0);
    const yearDays = yearMonths.reduce((s, m) => s + m.days, 0);
    const prevYear = String(Number(year) - 1);
    const prevMeta = data.monthsMeta.filter((m) => String(m.be) === prevYear);
    const overlap = yearMonths
      .map((m) => m.order)
      .filter((o) => prevMeta.some((p) => p.order === o));

    const codes = new Set<string>();
    keys.forEach((k) => Object.keys(data.monthlyBranch[k] ?? {}).forEach((c) => codes.add(c)));

    return [...codes]
      .map((code) => {
        let value = 0;
        let bills = 0;
        let billVal = 0;
        for (const k of keys) {
          value += data.monthlyBranch[k]?.[code]?.value ?? 0;
          const bk = data.basketMB[k]?.[code];
          if (bk) {
            bills += bk.bills;
            billVal += bk.avg * bk.bills;
          }
        }
        // YoY เฉพาะเดือนที่มีทั้งสองปี
        let curO = 0;
        let prevO = 0;
        for (const o of overlap) {
          const oo = String(o).padStart(2, "0");
          curO += data.monthlyBranch[`${year}-${oo}`]?.[code]?.value ?? 0;
          prevO += data.monthlyBranch[`${prevYear}-${oo}`]?.[code]?.value ?? 0;
        }
        return {
          code,
          name: nameOf[code] ?? code,
          value,
          share: yearTotal ? (value / yearTotal) * 100 : 0,
          perDay: yearDays ? value / yearDays : 0,
          bills: bills || null,
          basket: bills ? billVal / bills : null,
          growth: prevO ? ((curO - prevO) / prevO) * 100 : null,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [year, month, yearMonths, data, nameOf]);

  const maxShare = Math.max(...rows.map((r) => r.share), 1);
  const growthLabel =
    year === "all"
      ? "เดือนล่าสุดเทียบก่อนหน้า"
      : month === "all"
        ? "YoY เทียบปีก่อน (เดือนที่มีทั้งสองปี)"
        : "เทียบเดือนก่อนหน้า";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          จัดอันดับสาขา
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={year}
            onChange={(e) => onYear(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="all">ทุกปี ({data.monthsMeta.length} เดือน)</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                ปี {y}
              </option>
            ))}
          </select>
          {year !== "all" && (
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">ทั้งปี {year}</option>
              {yearMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        ยอดขาย · สัดส่วน · เฉลี่ย/วัน · บิล · Basket · Growth ({growthLabel})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">สาขา</th>
              <th className="px-2 py-2 text-right font-medium">ยอดขาย</th>
              <th className="px-2 py-2 text-right font-medium">สัดส่วน</th>
              <th className="px-2 py-2 text-right font-medium">เฉลี่ย/วัน</th>
              <th className="px-2 py-2 text-right font-medium">บิล</th>
              <th className="px-2 py-2 text-right font-medium">Basket</th>
              <th className="px-2 py-2 text-right font-medium">Growth</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.code}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                  <span className="text-slate-400">{r.code}</span> {r.name}
                </td>
                <td className="px-2 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {baht(r.value)}
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-slate-600 dark:text-slate-300">
                      {r.share.toFixed(1)}%
                    </span>
                    <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 sm:block">
                      <span
                        className="block h-full rounded-full bg-emerald-500"
                        style={{ width: `${(r.share / maxShare) * 100}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                  {baht(r.perDay)}
                </td>
                <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                  {r.bills === null ? (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  ) : (
                    num(r.bills)
                  )}
                </td>
                <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                  {r.basket === null ? (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  ) : (
                    baht(r.basket)
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <Growth pct={r.growth} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        บิล/Basket มีเฉพาะสาขา/เดือนที่มีรายงานรายบิล · GP% ยังไม่แสดง (ไม่มีข้อมูลต้นทุน)
      </p>
    </div>
  );
}
