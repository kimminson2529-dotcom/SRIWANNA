import { baht, num } from "../lib/format";

export type BranchRow = {
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
  if (pct === null) return <span className="text-slate-400">—</span>;
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

export default function BranchComparison({ rows }: { rows: BranchRow[] }) {
  const maxShare = Math.max(...rows.map((r) => r.share), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
        จัดอันดับสาขา
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        ยอดขาย · สัดส่วน · เฉลี่ย/วัน · บิล · Basket · Growth (เดือนล่าสุดเทียบก่อนหน้า)
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
        บิล/Basket มีเฉพาะสาขาที่มีรายงานรายบิล · GP% ยังไม่แสดง (ไม่มีข้อมูลต้นทุน)
      </p>
    </div>
  );
}
