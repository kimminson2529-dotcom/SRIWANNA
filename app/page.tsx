import reportData from "./data/report.json";
import type { SalesReport } from "./report-types";
import { baht, num } from "./lib/format";
import MonthlyBarChart from "./components/MonthlyBarChart";
import MonthlyGrowth from "./components/MonthlyGrowth";
import TopProductsChart from "./components/TopProductsChart";
import BranchChart from "./components/BranchChart";
import BranchComparison, { type BranchRow } from "./components/BranchComparison";
import CategoryGrowth from "./components/CategoryGrowth";
import AvgBasket from "./components/AvgBasket";
import MonthExplorer from "./components/MonthExplorer";

const report = reportData as SalesReport;

const compactBaht = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 2 }).format(v) +
  " บาท";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Page() {
  const monthlyData = report.months.map((m) => ({
    label: m.label,
    value: m.totalValue,
  }));
  const topData = report.topByValue.slice(0, 10).map((p) => ({
    name: p.name || p.code,
    value: p.value,
  }));

  const bestMonth = [...report.months].sort((a, b) => b.totalValue - a.totalValue)[0];
  const avgPerMonth = report.monthCount ? report.grandValue / report.monthCount : 0;
  const salesPerBranch = report.branchCount ? report.grandValue / report.branchCount : 0;

  // ===== จัดอันดับสาขา =====
  const branchSeries = new Map<string, number[]>();
  report.months.forEach((m, i) => {
    m.branches.forEach((b) => {
      const arr =
        branchSeries.get(b.code) ?? new Array(report.months.length).fill(0);
      arr[i] = b.value;
      branchSeries.set(b.code, arr);
    });
  });
  const basketByCode = new Map(report.basket.branches.map((b) => [b.code, b]));
  const branchRows: BranchRow[] = [...report.branches]
    .map((b) => {
      const series = branchSeries.get(b.code) ?? [];
      const last = series[series.length - 1] ?? 0;
      const prev = series[series.length - 2] ?? 0;
      const bk = basketByCode.get(b.code);
      return {
        code: b.code,
        name: b.name,
        value: b.value,
        share: report.grandValue ? (b.value / report.grandValue) * 100 : 0,
        perDay: report.periodDays ? b.value / report.periodDays : 0,
        bills: bk ? bk.bills : null,
        basket: bk ? bk.avgBasket : null,
        growth: prev ? ((last - prev) / prev) * 100 : null,
      };
    })
    .sort((a, b) => b.value - a.value);

  const lastM = report.months[report.months.length - 1];
  const prevM = report.months[report.months.length - 2];
  const lastGrowth =
    lastM && prevM && prevM.totalValue
      ? ((lastM.totalValue - prevM.totalValue) / prevM.totalValue) * 100
      : null;
  const growthStr =
    lastGrowth === null
      ? "—"
      : `${lastGrowth > 0 ? "▲ +" : lastGrowth < 0 ? "▼ " : ""}${lastGrowth.toFixed(1)}%`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            SRIWANNA · สรุปการขาย
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            รายงานการขายหน้าร้าน · {report.months[0]?.label} –{" "}
            {report.months[report.months.length - 1]?.label}
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            label="ยอดขายรวม"
            value={compactBaht(report.grandValue)}
            sub={`${report.monthCount} เดือน · ${num(report.grandQty)} หน่วย`}
          />
          <Card label="เฉลี่ยต่อเดือน" value={compactBaht(avgPerMonth)} />
          <Card
            label="ยอดขายต่อสาขา"
            value={compactBaht(salesPerBranch)}
            sub={`ยอดรวม ÷ ${report.branchCount} สาขา`}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              เติบโตล่าสุด (MoM)
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                (lastGrowth ?? 0) > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (lastGrowth ?? 0) < 0
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-800 dark:text-slate-100"
              }`}
            >
              {growthStr}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {lastM?.label} เทียบ {prevM?.label}
            </p>
          </div>
          <Card
            label="เดือนที่ขายมากสุด"
            value={bestMonth?.label ?? "-"}
            sub={bestMonth ? baht(bestMonth.totalValue) : ""}
          />
          <Card
            label="ยอดเฉลี่ยต่อบิล (AVG Basket)"
            value={baht(report.basket.avgBasket)}
            sub={
              report.basket.scope
                ? `${num(report.basket.totalBills)} บิล · สาขา ${report.basket.scope}`
                : `${num(report.basket.totalBills)} บิล`
            }
          />
        </div>

        <MonthlyBarChart data={monthlyData} />

        <MonthlyGrowth months={report.months} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopProductsChart data={topData} />
          <BranchChart branches={report.branches} />
        </div>

        <BranchComparison rows={branchRows} />

        <CategoryGrowth
          categories={report.categories}
          monthKeys={report.monthKeys}
          grandValue={report.grandValue}
        />

        <AvgBasket basket={report.basket} />

        <MonthExplorer months={report.months} branches={report.branches} />
      </div>

      <footer className="mt-10 space-y-1 text-center text-xs text-slate-400">
        <p>{report.note}</p>
        <p>
          SRIWANNA Sales · Next.js + Supabase · อัปเดตข้อมูล{" "}
          {new Date(report.generatedAt).toLocaleDateString("th-TH")}
        </p>
      </footer>
    </main>
  );
}
