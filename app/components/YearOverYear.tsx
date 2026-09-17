import type { ReportMonth } from "../report-types";
import { baht } from "../lib/format";

const MONTH_LABEL = [
  "", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function GrowthCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300 dark:text-slate-600">—</span>;
  const up = value > 0;
  const down = value < 0;
  const color = up
    ? "text-emerald-600 dark:text-emerald-400"
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

export default function YearOverYear({ months }: { months: ReportMonth[] }) {
  const years = [...new Set(months.map((m) => m.be))].filter(
    (y): y is number => y !== null,
  );
  years.sort((a, b) => a - b);

  const val = new Map<string, number>();
  for (const m of months) val.set(`${m.be}-${m.order}`, m.totalValue);

  // ใช้สองปีล่าสุดในการเทียบ
  const prevYear = years[years.length - 2] ?? null;
  const curYear = years[years.length - 1] ?? null;

  if (!prevYear || !curYear) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          การเติบโตเทียบปี (YoY)
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          ต้องมีข้อมูลอย่างน้อย 2 ปีจึงจะเทียบ YoY ได้ (ตอนนี้มีปีเดียว)
        </p>
      </div>
    );
  }

  const rows = [];
  let sumPrev = 0;
  let sumCur = 0;
  for (let o = 1; o <= 12; o++) {
    const p = val.get(`${prevYear}-${o}`) ?? null;
    const c = val.get(`${curYear}-${o}`) ?? null;
    if (p === null && c === null) continue;
    const yoy = p && c !== null && p !== 0 ? ((c - p) / p) * 100 : null;
    if (p !== null && c !== null) {
      sumPrev += p;
      sumCur += c;
    }
    rows.push({ order: o, p, c, yoy });
  }
  const totalYoY = sumPrev ? ((sumCur - sumPrev) / sumPrev) * 100 : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
        การเติบโตเทียบปี (YoY)
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        เทียบเดือนเดียวกัน ปี {curYear} เทียบ {prevYear} · เฉพาะเดือนที่มีข้อมูลทั้งสองปี
      </p>

      {totalYoY !== null && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            รวมเดือนที่เทียบได้: {baht(sumCur)} เทียบ {baht(sumPrev)}
          </span>
          <span className="rounded-lg bg-emerald-50 px-3 py-1 dark:bg-emerald-950/40">
            YoY รวม <GrowthCell value={totalYoY} />
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">เดือน</th>
              <th className="px-2 py-2 text-right font-medium">{prevYear}</th>
              <th className="px-2 py-2 text-right font-medium">{curYear}</th>
              <th className="px-2 py-2 text-right font-medium">YoY</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.order}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-2 py-2 text-slate-700 dark:text-slate-200">
                  {MONTH_LABEL[r.order]}
                </td>
                <td className="px-2 py-2 text-right text-slate-500 dark:text-slate-400">
                  {r.p === null ? (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  ) : (
                    baht(r.p)
                  )}
                </td>
                <td className="px-2 py-2 text-right font-medium text-slate-700 dark:text-slate-200">
                  {r.c === null ? (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  ) : (
                    baht(r.c)
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  <GrowthCell value={r.yoy} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
