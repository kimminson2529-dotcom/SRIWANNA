import { baht, num } from "../lib/format";

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-800 dark:text-slate-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function SummaryCards({
  totalRevenue,
  totalQty,
  orderCount,
  todayRevenue,
}: {
  totalRevenue: number;
  totalQty: number;
  orderCount: number;
  todayRevenue: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        label="ยอดขายรวม"
        value={baht(totalRevenue)}
        accent="text-[#8e1538] dark:text-[#e6b3c1]"
      />
      <Card label="ยอดขายวันนี้" value={baht(todayRevenue)} />
      <Card label="จำนวนสินค้าที่ขาย" value={num(totalQty) + " ชิ้น"} />
      <Card label="จำนวนรายการ" value={num(orderCount) + " รายการ"} />
    </div>
  );
}
