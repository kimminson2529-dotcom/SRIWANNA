"use client";

import { useRef, useState, useTransition } from "react";
import { addSale } from "../actions";
import { baht, todayISO } from "../lib/format";

export default function SaleForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  const preview = (Number(qty) || 0) * (Number(price) || 0);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addSale(fd);
      if (res.ok) {
        setOk(true);
        formRef.current?.reset();
        setQty("");
        setPrice("");
        setTimeout(() => setOk(false), 2500);
      } else {
        setError(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        บันทึกยอดขาย
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">วันที่</span>
          <input
            type="date"
            name="sale_date"
            required
            defaultValue={todayISO()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#ecdfae] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">สินค้า</span>
          <input
            type="text"
            name="product"
            required
            placeholder="เช่น ข้าวหอมมะลิ 5 กก."
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#ecdfae] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">จำนวน</span>
          <input
            type="number"
            name="quantity"
            required
            min="0"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#ecdfae] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            ราคา/หน่วย (บาท)
          </span>
          <input
            type="number"
            name="price"
            required
            min="0"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#ecdfae] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-slate-600 dark:text-slate-300">
            หมายเหตุ (ไม่บังคับ)
          </span>
          <input
            type="text"
            name="note"
            placeholder="เช่น ลูกค้าประจำ / ช่องทางขาย"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#ecdfae] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ยอดรวม:{" "}
          <span className="font-semibold text-[#8e1538] dark:text-[#e6b3c1]">
            {baht(preview)}
          </span>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#7a1030] px-5 py-2 font-medium text-white transition hover:bg-[#5f0c26] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      {ok && (
        <p className="mt-3 rounded-lg bg-[#f6eeda] px-3 py-2 text-sm text-[#7a1030] dark:bg-[#7a1030]/30 dark:text-[#e6b3c1]">
          บันทึกเรียบร้อยแล้ว ✓
        </p>
      )}
    </form>
  );
}
