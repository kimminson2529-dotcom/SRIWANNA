import reportData from "./data/report.json";
import type { SalesReport } from "./report-types";
import { baht, num } from "./lib/format";
import MonthlyBarChart from "./components/MonthlyBarChart";
import MonthlyGrowth from "./components/MonthlyGrowth";
import YearOverYear from "./components/YearOverYear";
import TopProductsChart from "./components/TopProductsChart";
import BranchChart from "./components/BranchChart";
import BranchComparison, {
  type BranchComparisonData,
} from "./components/BranchComparison";
import CategoryGrowth from "./components/CategoryGrowth";
import AvgBasket from "./components/AvgBasket";
import MonthExplorer from "./components/MonthExplorer";

const report = reportData as SalesReport;

const compactBaht = (v: number) =>
  new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 2 }).format(v) +
  " บาท";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      {sub && <p className="mt-0.5 break-words text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Page() {
  const monthlyData = report.months.map((m) => ({
    label: m.label,
    value: m.totalValue,
    be: m.be,
  }));
  const topData = report.topByValue.slice(0, 10).map((p) => ({
    name: p.name || p.code,
    value: p.value,
  }));

  const bestMonth = [...report.months].sort((a, b) => b.totalValue - a.totalValue)[0];
  const avgPerMonth = report.monthCount ? report.grandValue / report.monthCount : 0;
  const salesPerBranch = report.branchCount ? report.grandValue / report.branchCount : 0;

  // ===== ข้อมูลจัดอันดับสาขา (รองรับเลือกเดือน) =====
  const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysIn = (order: number, be: number | null) => {
    const ce = be ? be - 543 : 2026;
    return order === 2 && isLeap(ce) ? 29 : DAYS[order] || 30;
  };

  const monthlyBranch: Record<string, Record<string, { value: number; qty: number }>> = {};
  report.months.forEach((m) => {
    monthlyBranch[m.key] = {};
    m.branches.forEach((b) => {
      monthlyBranch[m.key][b.code] = { value: b.value, qty: b.qty };
    });
  });
  const basketMB: Record<string, Record<string, { bills: number; avg: number }>> = {};
  const basketAll: Record<string, { bills: number; avg: number }> = {};
  report.basket.branches.forEach((b) => {
    basketAll[b.code] = { bills: b.bills, avg: b.avgBasket };
    b.months.forEach((mm) => {
      (basketMB[mm.key] ??= {})[b.code] = { bills: mm.bills, avg: mm.avgBasket };
    });
  });
  const branchData: BranchComparisonData = {
    branches: report.branches.map((b) => ({
      code: b.code,
      name: b.name,
      value: b.value,
    })),
    monthsMeta: report.months.map((m) => ({
      key: m.key,
      label: m.label,
      order: m.order,
      be: m.be,
      days: daysIn(m.order, m.be),
      totalValue: m.totalValue,
    })),
    monthlyBranch,
    basketMB,
    basketAll,
    periodDays: report.periodDays,
    grandValue: report.grandValue,
  };

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
    <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6">
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
            sub={`${num(report.basket.totalBills)} บิล · ${report.basket.branches.length} สาขาที่มีบิล`}
          />
        </div>

        <MonthlyBarChart data={monthlyData} />

        <MonthlyGrowth months={report.months} />

        <YearOverYear months={report.months} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopProductsChart data={topData} />
          <BranchChart branches={report.branches} />
        </div>

        <BranchComparison data={branchData} />

        <CategoryGrowth
          categories={report.categories}
          monthKeys={report.monthKeys}
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
