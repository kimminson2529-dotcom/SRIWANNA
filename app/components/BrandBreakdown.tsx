import type { Brand } from "../report-types";
import { baht, num } from "../lib/format";

export default function BrandBreakdown({
  brands,
  brandCount,
}: {
  brands: Brand[];
  brandCount: number;
}) {
  const maxShare = Math.max(...brands.map((b) => b.share), 1);
  const isOther = (name: string) => name.startsWith("อื่นๆ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
        ยอดขายแยกตามแบรนด์
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        แบรนด์ดึงจากชื่อสินค้า · แสดง 15 อันดับแรก จากทั้งหมด {num(brandCount)} แบรนด์
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-2 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">แบรนด์</th>
              <th className="px-2 py-2 text-right font-medium">ยอดขาย</th>
              <th className="px-2 py-2 text-right font-medium">สัดส่วน</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b, i) => (
              <tr
                key={b.name}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-2 py-2 text-slate-400">
                  {isOther(b.name) ? "" : i + 1}
                </td>
                <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                  {isOther(b.name) ? (
                    <span className="text-slate-500 dark:text-slate-400">{b.name}</span>
                  ) : (
                    b.name
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right font-semibold text-[#8e1538] dark:text-[#e6b3c1]">
                  {baht(b.value)}
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-12 text-right text-slate-600 dark:text-slate-300">
                      {b.share.toFixed(1)}%
                    </span>
                    <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 sm:block">
                      <span
                        className="block h-full rounded-full bg-[#c9a227]"
                        style={{ width: `${(b.share / maxShare) * 100}%` }}
                      />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
