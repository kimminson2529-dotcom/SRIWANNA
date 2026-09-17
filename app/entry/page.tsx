import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Sale } from "../types";
import { todayISO } from "../lib/format";
import SaleForm from "../components/SaleForm";
import SummaryCards from "../components/SummaryCards";
import SalesChart, { type ChartPoint } from "../components/SalesChart";
import SalesTable from "../components/SalesTable";

export const dynamic = "force-dynamic";

export default async function EntryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false });

  const sales = (data ?? []) as Sale[];

  const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
  const totalQty = sales.reduce((s, r) => s + Number(r.quantity), 0);
  const today = todayISO();
  const todayRevenue = sales
    .filter((r) => r.sale_date === today)
    .reduce((s, r) => s + Number(r.total), 0);

  const byDate = new Map<string, number>();
  for (const r of sales) {
    byDate.set(r.sale_date, (byDate.get(r.sale_date) ?? 0) + Number(r.total));
  }
  const chartData: ChartPoint[] = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, total]) => ({
      label: new Date(date + "T00:00:00").toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
      }),
      total,
    }));

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-[#8e1538] hover:underline dark:text-[#e6b3c1]"
        >
          ← กลับหน้าสรุปการขาย
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          บันทึกยอดขายรายวัน
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          บันทึกรายการขายใหม่ พร้อมยอดเงิน (เก็บลงฐานข้อมูล Supabase)
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          โหลดข้อมูลไม่สำเร็จ: {error.message}
        </div>
      )}

      <div className="space-y-6">
        <SummaryCards
          totalRevenue={totalRevenue}
          totalQty={totalQty}
          orderCount={sales.length}
          todayRevenue={todayRevenue}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SaleForm />
          <SalesChart data={chartData} />
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
            รายการขายทั้งหมด
          </h2>
          <SalesTable sales={sales} />
        </section>
      </div>
    </main>
  );
}
