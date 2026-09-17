-- ตารางเก็บยอดขาย (SRIWANNA)
-- รันสคริปต์นี้ใน Supabase > SQL Editor

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,   -- วันที่
  product text not null,                          -- สินค้า
  quantity numeric not null check (quantity > 0), -- จำนวน
  price numeric not null check (price >= 0),       -- ราคา/หน่วย
  total numeric generated always as (quantity * price) stored, -- ยอดรวม
  note text,                                       -- หมายเหตุ (ไม่บังคับ)
  created_at timestamptz not null default now()
);

create index if not exists sales_sale_date_idx on public.sales (sale_date);

-- เปิด Row Level Security
alter table public.sales enable row level security;

-- อนุญาตให้ publishable/anon key อ่าน-เขียนได้ทั้งหมด
-- (แอปภายในองค์กร ไม่มีระบบ login) ปรับให้เข้มขึ้นได้ภายหลัง
drop policy if exists "allow anon read" on public.sales;
create policy "allow anon read" on public.sales
  for select using (true);

drop policy if exists "allow anon insert" on public.sales;
create policy "allow anon insert" on public.sales
  for insert with check (true);

drop policy if exists "allow anon update" on public.sales;
create policy "allow anon update" on public.sales
  for update using (true) with check (true);

drop policy if exists "allow anon delete" on public.sales;
create policy "allow anon delete" on public.sales
  for delete using (true);
