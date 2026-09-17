"use client";

import { useState, useTransition } from "react";
import type { Sale } from "../types";
import { deleteSale } from "../actions";
import { baht, num, thaiDate } from "../lib/format";

export default function SalesTable({ sales }: { sales: Sale[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteSale(id);
      setPendingId(null);
    });
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 dark:border-slate-700">
        ยังไม่มีรายการขาย — เพิ่มรายการแรกได้เลย
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-4 py-3 font-medium">วันที่</th>
            <th className="px-4 py-3 font-medium">สินค้า</th>
            <th className="px-4 py-3 text-right font-medium">จำนวน</th>
            <th className="px-4 py-3 text-right font-medium">ราคา/หน่วย</th>
            <th className="px-4 py-3 text-right font-medium">ยอดรวม</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr
              key={s.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                {thaiDate(s.sale_date)}
              </td>
              <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                {s.product}
                {s.note && (
                  <span className="ml-2 text-xs text-slate-400">{s.note}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                {num(s.quantity)}
              </td>
              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                {baht(s.price)}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[#8e1538] dark:text-[#e6b3c1]">
                {baht(s.total)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDelete(s.id)}
                  disabled={pendingId === s.id}
                  className="rounded-md px-2 py-1 text-xs text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                >
                  {pendingId === s.id ? "กำลังลบ..." : "ลบ"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
