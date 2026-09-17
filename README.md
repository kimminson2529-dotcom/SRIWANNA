# SRIWANNA · ระบบเก็บยอดขาย

เว็บแอปสำหรับ **บันทึกและสรุปยอดขายรายวัน** พร้อมกราฟภาพรวม
สร้างด้วย **Next.js (App Router) + Supabase**

## ฟีเจอร์

- บันทึกยอดขาย: วันที่ · สินค้า · จำนวน · ราคา/หน่วย · หมายเหตุ
- คำนวณ **ยอดรวม** อัตโนมัติ (จำนวน × ราคา)
- การ์ดสรุป: ยอดขายรวม · ยอดขายวันนี้ · จำนวนสินค้า · จำนวนรายการ
- กราฟยอดขายรายวัน (14 วันล่าสุด)
- ตารางรายการทั้งหมด พร้อมปุ่มลบ
- เก็บข้อมูลจริงบน Supabase (PostgreSQL)

## การติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ค่าโปรเจกต์ของคุณ:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

### 3. สร้างตารางในฐานข้อมูล

เปิด Supabase Dashboard → **SQL Editor** → รันสคริปต์ใน
[`supabase/schema.sql`](supabase/schema.sql)

### 4. รันโปรเจกต์

```bash
npm run dev
```

เปิด http://localhost:3000

## โครงสร้างข้อมูล (ตาราง `sales`)

| คอลัมน์      | ชนิด      | ความหมาย            |
| ------------ | --------- | ------------------- |
| `sale_date`  | date      | วันที่               |
| `product`    | text      | สินค้า               |
| `quantity`   | numeric   | จำนวน                |
| `price`      | numeric   | ราคา/หน่วย           |
| `total`      | numeric   | ยอดรวม (คำนวณอัตโนมัติ) |
| `note`       | text      | หมายเหตุ (ไม่บังคับ)  |

## หมายเหตุด้านความปลอดภัย

แอปนี้ใช้ **publishable key** และเปิด RLS แบบอนุญาตทุกคน (ไม่มีระบบล็อกอิน)
เหมาะกับการใช้งานภายใน หากต้องการเปิดใช้งานสาธารณะ ควรเพิ่มระบบยืนยันตัวตน
และปรับ RLS policy ใน `supabase/schema.sql` ให้เข้มขึ้น
