"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ActionResult = { ok: boolean; error?: string };

export async function addSale(formData: FormData): Promise<ActionResult> {
  const sale_date = String(formData.get("sale_date") || "").trim();
  const product = String(formData.get("product") || "").trim();
  const quantity = Number(formData.get("quantity"));
  const price = Number(formData.get("price"));
  const note = String(formData.get("note") || "").trim();

  if (!sale_date) return { ok: false, error: "กรุณาระบุวันที่" };
  if (!product) return { ok: false, error: "กรุณาระบุชื่อสินค้า" };
  if (!Number.isFinite(quantity) || quantity <= 0)
    return { ok: false, error: "จำนวนต้องมากกว่า 0" };
  if (!Number.isFinite(price) || price < 0)
    return { ok: false, error: "ราคาไม่ถูกต้อง" };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("sales").insert({
    sale_date,
    product,
    quantity,
    price,
    note: note || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deleteSale(id: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}
