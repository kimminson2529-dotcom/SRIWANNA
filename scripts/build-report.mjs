// แปลงไฟล์ "รายงานการขายหน้าร้าน - ตามสินค้า - ตามสาขา" (.xls) -> app/data/report.json
// รันด้วย: npm run build:report
import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "Data", "รายงานการขายตามสินค้า");
const OUT = path.join(ROOT, "app", "data", "report.json");

const MONTH_LABEL = [
  "", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// ตำแหน่งคอลัมน์ (0-indexed) ของรายงานหน้าร้าน
const COL = {
  seq: 0,
  code: 3,
  name: 5,
  qtySub: 8, // จำนวน (แถวรวมแต่ละสินค้า / แถวรวม)
  qtyBranch: 9, // จำนวน (แถวรายสาขา)
  unit: 11,
  price: 12,
  netTotal: 21, // มูลค่ารวม (สุทธิ)
};

const CODE_RE = /^[A-Za-z]\d{1,2}-\w+/;
const numAt = (r, i) => (typeof r[i] === "number" ? r[i] : 0);
const str = (v) => (typeof v === "string" ? v.trim() : "");

function getPeriod(rows) {
  for (const r of rows.slice(0, 12)) {
    for (const c of r || []) {
      if (typeof c === "string" && c.includes("จาก:")) {
        const dates = [...c.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g)];
        if (dates.length) {
          const start = dates[0];
          const end = dates[1] || dates[0];
          const isRange =
            start[2] !== end[2] || start[3] !== end[3]; // เดือน/ปี ไม่ตรงกัน = ช่วงหลายเดือน
          return {
            order: Number(start[2]),
            ceYear: Number(start[3]),
            isRange,
          };
        }
      }
    }
  }
  return { order: 999, ceYear: null, isRange: false };
}

function parseWorkbook(filePath) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    defval: null,
  });

  const products = [];
  const branchMap = new Map();
  let grand = null;
  let cur = null;

  for (const r of rows) {
    if (!Array.isArray(r)) continue;
    const c0 = r[COL.seq];
    const c3 = str(r[COL.code]);
    const c5 = str(r[COL.name]);

    // แถวหัวสินค้า
    if (typeof c0 === "number" && CODE_RE.test(c3)) {
      cur = { code: c3, name: c5, unit: "" };
      continue;
    }
    // แถวรวมทั้งรายงาน
    if (c3 === "รวม") {
      grand = { qty: numAt(r, COL.qtySub), value: numAt(r, COL.netTotal) };
      continue;
    }
    // แถวรวมแต่ละสินค้า -> ยอดของสินค้านั้น
    if (c3 === "รวมแต่ละสินค้า") {
      if (cur) {
        products.push({
          code: cur.code,
          name: cur.name,
          unit: cur.unit,
          qty: numAt(r, COL.qtySub),
          value: numAt(r, COL.netTotal),
        });
      }
      continue;
    }
    // แถวรายสาขา
    if (c3.startsWith("สาขา")) {
      const m = c3.match(/\((\d+)\)\s*(.*)$/);
      const bcode = m ? m[1] : c3;
      const bname = m ? m[2].trim() : c3.replace(/^สาขา\s*:?\s*/, "");
      const qty = numAt(r, COL.qtyBranch);
      const value = numAt(r, COL.netTotal);
      if (cur && !cur.unit) cur.unit = str(r[COL.unit]);
      const b = branchMap.get(bcode) || { code: bcode, name: bname, qty: 0, value: 0 };
      b.qty += qty;
      b.value += value;
      if (!b.name && bname) b.name = bname;
      branchMap.set(bcode, b);
      continue;
    }
  }

  const totalQty = products.reduce((s, p) => s + p.qty, 0);
  const totalValue = products.reduce((s, p) => s + p.value, 0);
  return { products, branches: [...branchMap.values()], totalQty, totalValue, grand };
}

const round2 = (n) => Math.round(n * 100) / 100;

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error("ไม่พบโฟลเดอร์ข้อมูล:", DATA_DIR);
    process.exit(1);
  }
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".xls"));

  const months = [];
  const overall = new Map();
  const branchOverall = new Map();

  const skipped = [];
  for (const f of files) {
    const wb = XLSX.read(fs.readFileSync(path.join(DATA_DIR, f)), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
      header: 1, raw: true, defval: null,
    });
    const { order, ceYear, isRange } = getPeriod(rows);
    const be = ceYear ? ceYear + 543 : null;

    // ข้ามไฟล์ที่เป็นช่วงหลายเดือน (กันนับซ้ำกับไฟล์รายเดือน)
    if (isRange) {
      console.warn(`  ↷ ข้ามไฟล์ช่วงหลายเดือน (กันนับซ้ำ): ${f}`);
      skipped.push(f);
      continue;
    }

    let parsed;
    try {
      parsed = parseWorkbook(path.join(DATA_DIR, f));
    } catch (e) {
      console.error("ข้ามไฟล์ (อ่านไม่ได้):", f, "-", e.message);
      continue;
    }
    const { products, branches, totalQty, totalValue, grand } = parsed;

    if (grand && Math.abs(round2(grand.value) - round2(totalValue)) > 1) {
      console.warn(
        `  ⚠ ${f}: ยอดคำนวณ ${round2(totalValue)} ไม่ตรงแถวรวม ${round2(grand.value)}`,
      );
    }

    months.push({
      key: `${be}-${String(order).padStart(2, "0")}`,
      order,
      be,
      label: `${MONTH_LABEL[order] ?? order} ${be}`,
      totalQty,
      totalValue: round2(totalValue),
      productCount: products.length,
      branchCount: branches.length,
      products: products
        .map((p) => ({ ...p, value: round2(p.value) }))
        .sort((a, b) => b.value - a.value),
      branches: branches
        .map((b) => ({ ...b, value: round2(b.value) }))
        .sort((a, b) => b.value - a.value),
    });

    for (const p of products) {
      const k = p.code || p.name;
      const cur = overall.get(k) || { code: p.code, name: p.name, unit: p.unit, qty: 0, value: 0 };
      cur.qty += p.qty;
      cur.value += p.value;
      if (!cur.name && p.name) cur.name = p.name;
      overall.set(k, cur);
    }
    for (const b of branches) {
      const cur = branchOverall.get(b.code) || { code: b.code, name: b.name, qty: 0, value: 0 };
      cur.qty += b.qty;
      cur.value += b.value;
      if (!cur.name && b.name) cur.name = b.name;
      branchOverall.set(b.code, cur);
    }
  }

  months.sort((a, b) => (a.be - b.be) || (a.order - b.order));

  const topByValue = [...overall.values()]
    .map((p) => ({ ...p, value: round2(p.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
  const topByQty = [...overall.values()]
    .map((p) => ({ ...p, value: round2(p.value) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 20);
  const branches = [...branchOverall.values()]
    .map((b) => ({ ...b, value: round2(b.value) }))
    .sort((a, b) => b.value - a.value);

  const grandValue = round2(months.reduce((s, m) => s + m.totalValue, 0));
  const grandQty = months.reduce((s, m) => s + m.totalQty, 0);

  // ===== AVG Basket Size จากรายงานการขายตามบิล =====
  const BILL_DIR = path.join(ROOT, "Data", "รายงานการขายตามบิล");
  const basketMonths = [];
  let totalBills = 0;
  let totalBillValue = 0;
  const basketBranches = new Set();
  if (fs.existsSync(BILL_DIR)) {
    const billFiles = fs
      .readdirSync(BILL_DIR)
      .filter((f) => f.toLowerCase().endsWith(".xls"));
    for (const f of billFiles) {
      const wb = XLSX.read(fs.readFileSync(path.join(BILL_DIR, f)), { type: "buffer" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header: 1, raw: true, defval: null,
      });
      const { order, ceYear, isRange } = getPeriod(rows);
      if (isRange) {
        console.warn(`  ↷ ข้ามไฟล์บิลช่วงหลายเดือน: ${f}`);
        continue;
      }
      const be = ceYear ? ceYear + 543 : null;
      let bills = 0;
      let val = 0;
      for (const r of rows) {
        if (!Array.isArray(r)) continue;
        if (typeof r[7] === "string" && r[7].trim() === "รวมทั้งหมด(บิล)") continue;
        // แถวหัวบิล: ลำดับ(ตัวเลข)@0 + เลขที่เอกสาร(string)@2
        if (typeof r[0] === "number" && typeof r[2] === "string") {
          bills++;
          val += Number(r[22]) || 0; // มูลค่ารวม(บิล) อยู่คอลัมน์ 22 ในรายงานตามบิล
          const m = r[2].match(/^[A-Za-z]\d{2}(\d{3})/);
          if (m) basketBranches.add(m[1]);
        }
      }
      basketMonths.push({
        key: `${be}-${String(order).padStart(2, "0")}`,
        order,
        be,
        label: `${MONTH_LABEL[order] ?? order} ${be}`,
        bills,
        billTotal: round2(val),
        avgBasket: bills ? round2(val / bills) : 0,
      });
      totalBills += bills;
      totalBillValue += val;
    }
    basketMonths.sort((a, b) => (a.be - b.be) || (a.order - b.order));
  }
  const basketScope =
    [...basketBranches]
      .map((c) => {
        const b = branchOverall.get(c);
        return b ? `${c} ${b.name}` : c;
      })
      .join(", ") || null;
  const basket = {
    scope: basketScope,
    totalBills,
    totalValue: round2(totalBillValue),
    avgBasket: totalBills ? round2(totalBillValue / totalBills) : 0,
    months: basketMonths,
  };

  const out = {
    generatedAt: new Date().toISOString(),
    source: "รายงานการขายหน้าร้าน - ตามสินค้า - ตามสาขา (.xls)",
    note: "ยอดขายเป็นมูลค่ารวมสุทธิ (รวมภาษี หลังหักส่วนลด)",
    grandValue,
    grandQty,
    monthCount: months.length,
    productCount: overall.size,
    branchCount: branchOverall.size,
    months,
    topByValue,
    topByQty,
    branches,
    basket,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log("เขียน", OUT);
  console.log(
    "เดือน:",
    months.map((m) => `${m.label}=${m.totalValue.toLocaleString()}฿`).join("  "),
  );
  console.log(
    `รวม ${grandValue.toLocaleString()}฿ | ${grandQty.toLocaleString()} หน่วย | สินค้า ${overall.size} | สาขา ${branchOverall.size}`,
  );
  console.log(
    `AVG Basket: ${basket.avgBasket.toLocaleString()}฿/บิล | ${basket.totalBills.toLocaleString()} บิล | scope: ${basket.scope}`,
  );
}

main();
