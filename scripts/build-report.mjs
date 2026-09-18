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

const THAI_MONTHS = {
  มกราคม: 1, กุมภาพันธ: 2, มีนาคม: 3, เมษายน: 4, พฤษภาคม: 5, มิถุนายน: 6,
  กรกฎาคม: 7, กรกฏาคม: 7, สิงหาคม: 8, กันยายน: 9, ตุลาคม: 10,
  พฤศจิกายน: 11, ธันวาคม: 12,
};

// อ่านเดือน/ปีจากชื่อไฟล์ (fallback เมื่อไม่พบ "จาก:")
function periodFromName(name) {
  let order = 999;
  let ceYear = null;
  for (const [th, m] of Object.entries(THAI_MONTHS)) {
    if (name.includes(th) || name.includes(th.slice(0, 4))) {
      order = m;
      break;
    }
  }
  const y = name.match(/(25\d{2})/); // ปี พ.ศ. ในชื่อไฟล์
  if (y) ceYear = Number(y[1]) - 543;
  return { order, ceYear, isRange: false };
}

function getPeriod(rows) {
  for (const r of rows.slice(0, 25)) {
    for (const c of r || []) {
      if (typeof c === "string" && c.includes("จาก:")) {
        const dates = [...c.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g)];
        if (dates.length) {
          const s = dates[0];
          const e = dates[1] || dates[0];
          const t0 = Date.UTC(+s[3], +s[2] - 1, +s[1]);
          const t1 = Date.UTC(+e[3], +e[2] - 1, +e[1]);
          const diffDays = (t1 - t0) / 86400000;
          // ช่วงหลายเดือน = ครอบคลุมเกิน ~45 วัน (ไฟล์เดือนเดียวจะ ~28-31 วัน)
          return {
            found: true,
            order: Number(s[2]),
            ceYear: Number(s[3]),
            isRange: diffDays > 45,
            startDay: Number(s[1]),
            endDay: Number(e[1]),
            endMonth: Number(e[2]),
          };
        }
      }
    }
  }
  return { found: false, order: 999, ceYear: null, isRange: false };
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
      cur = { code: c3, name: c5, unit: "", byBranch: {} };
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
          byBranch: cur.byBranch,
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
      if (cur) {
        const pb = cur.byBranch[bcode] || { qty: 0, value: 0 };
        pb.qty += qty;
        pb.value += value;
        cur.byBranch[bcode] = pb;
      }
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

// รวมไฟล์ .xls ทั้งหมด รวมถึงในโฟลเดอร์ย่อย (เช่น แยกรายปี 2568/2569)
function listXls(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true })
    .map((f) => String(f))
    .filter((f) => f.toLowerCase().endsWith(".xls"));
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error("ไม่พบโฟลเดอร์ข้อมูล:", DATA_DIR);
    process.exit(1);
  }
  const files = listXls(DATA_DIR);

  const months = [];
  const overall = new Map();
  const branchOverall = new Map();
  let current = null; // เดือนปัจจุบัน (ไฟล์ยอดขายล่าสุด แบบไม่ครบเดือน)

  const DAYS_M = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYr = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (order, ceYear) =>
    order === 2 && isLeapYr(ceYear) ? 29 : DAYS_M[order] || 30;

  const skipped = [];
  for (const f of files) {
    const wb = XLSX.read(fs.readFileSync(path.join(DATA_DIR, f)), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
      header: 1, raw: true, defval: null,
    });
    const per = getPeriod(rows);
    // ไฟล์ไม่มีช่วงวันที่ที่อ่านได้ = ตรวจสอบเดือนไม่ได้/ไฟล์ผิดปกติ -> ข้าม
    if (!per.found) {
      console.warn(`  ↷ ข้ามไฟล์ (ไม่พบช่วงวันที่ในรายงาน): ${f}`);
      skipped.push(f);
      continue;
    }
    const { order, ceYear, isRange } = per;
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

    // ไฟล์เดือนปัจจุบัน (ไม่ครบเดือน) = วันสิ้นสุด < วันสุดท้ายของเดือน -> แยกเป็น "ยอดขายปัจจุบัน" + ประมาณการณ์ ไม่รวมในยอดสะสม
    const dim = daysInMonth(order, ceYear);
    if (per.endDay && per.endDay < dim && per.endMonth === order) {
      const val = round2(totalValue);
      current = {
        key: `${be}-${String(order).padStart(2, "0")}`,
        order,
        be,
        label: `${MONTH_LABEL[order] ?? order} ${be}`,
        daysWithData: per.endDay,
        daysInMonth: dim,
        value: val,
        qty: totalQty,
        forecast: round2((totalValue / per.endDay) * dim),
        startDay: per.startDay,
      };
      console.warn(
        `  ↷ เดือนปัจจุบัน (ไม่ครบเดือน): ${f} -> ยอด ${val} (${per.endDay}/${dim} วัน) ประมาณการณ์ ${current.forecast}`,
      );
      continue;
    }

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
        .map((p) => ({
          ...p,
          value: round2(p.value),
          byBranch: Object.fromEntries(
            Object.entries(p.byBranch || {}).map(([c, v]) => [
              c,
              { qty: v.qty, value: round2(v.value) },
            ]),
          ),
        }))
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

  // ===== AVG Basket Size จากรายงานการขายตามบิล (แยกรายสาขา + รายเดือน) =====
  const BILL_DIR = path.join(ROOT, "Data", "รายงานการขายตามบิล");
  const mkMonth = (order, be) => ({
    key: `${be}-${String(order).padStart(2, "0")}`,
    order,
    be,
    label: `${MONTH_LABEL[order] ?? order} ${be}`,
  });
  const billMonthAll = new Map(); // monthKey -> {order,be,label,bills,value}
  const billBranch = new Map(); // code -> {code,bills,value,months:Map}
  let totalBills = 0;
  let totalBillValue = 0;
  if (fs.existsSync(BILL_DIR)) {
    const billFiles = listXls(BILL_DIR);
    for (const f of billFiles) {
      const wb = XLSX.read(fs.readFileSync(path.join(BILL_DIR, f)), { type: "buffer" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header: 1, raw: true, defval: null,
      });
      const per = getPeriod(rows);
      if (per.found && per.isRange) {
        console.warn(`  ↷ ข้ามไฟล์บิลช่วงหลายเดือน: ${f}`);
        continue;
      }
      // เดือน: จาก "จาก:" ถ้ามี ไม่งั้นอ่านจากชื่อไฟล์
      const order = per.found ? per.order : periodFromName(f).order;
      if (order === 999) {
        console.warn(`  ↷ ข้ามไฟล์บิล (ระบุเดือนไม่ได้): ${f}`);
        continue;
      }
      // แยกบิลแบบไม่ขึ้นกับ layout: หา docNo อัตโนมัติ, ยอด = ตัวเลขสุดท้ายของแถว, ปี = YY จาก docNo
      // docNo เช่น R26101001-000006 -> [_, YY=26, branch=101]
      const DOC_RE = /^[A-Za-z](\d{2})(\d{3})\d{3}/;
      let fileCeYear = per.found ? per.ceYear : null;
      const fileBills = [];
      for (const r of rows) {
        if (!Array.isArray(r) || typeof r[0] !== "number") continue;
        let doc = null;
        for (const c of r) {
          if (typeof c === "string") {
            const m = c.trim().match(DOC_RE);
            if (m) {
              doc = m;
              break;
            }
          }
        }
        if (!doc) continue;
        let total = null;
        for (let i = r.length - 1; i >= 0; i--) {
          if (typeof r[i] === "number") {
            total = r[i];
            break;
          }
        }
        if (total === null) continue;
        if (!fileCeYear) fileCeYear = 2000 + Number(doc[1]);
        fileBills.push({ code: doc[2], value: total });
      }
      const be = fileCeYear ? fileCeYear + 543 : null;
      const mi = mkMonth(order, be);
      for (const bill of fileBills) {
        totalBills++;
        totalBillValue += bill.value;
        const am = billMonthAll.get(mi.key) || { ...mi, bills: 0, value: 0 };
        am.bills++;
        am.value += bill.value;
        billMonthAll.set(mi.key, am);
        const br = billBranch.get(bill.code) || { code: bill.code, bills: 0, value: 0, months: new Map() };
        br.bills++;
        br.value += bill.value;
        const bm = br.months.get(mi.key) || { ...mi, bills: 0, value: 0 };
        bm.bills++;
        bm.value += bill.value;
        br.months.set(mi.key, bm);
        billBranch.set(bill.code, br);
      }
    }
  }
  const finishMonths = (map) =>
    [...map.values()]
      .sort((a, b) => (a.be - b.be) || (a.order - b.order))
      .map((m) => ({
        key: m.key,
        order: m.order,
        be: m.be,
        label: m.label,
        bills: m.bills,
        billTotal: round2(m.value),
        avgBasket: m.bills ? round2(m.value / m.bills) : 0,
      }));

  const basketMonths = finishMonths(billMonthAll);
  const basketBranchArr = [...billBranch.values()]
    .sort((a, b) => b.value - a.value)
    .map((b) => ({
      code: b.code,
      name: branchOverall.get(b.code)?.name || b.code,
      bills: b.bills,
      value: round2(b.value),
      avgBasket: b.bills ? round2(b.value / b.bills) : 0,
      months: finishMonths(b.months),
    }));
  const basketScope =
    basketBranchArr.map((b) => `${b.code} ${b.name}`).join(", ") || null;
  const basket = {
    scope: basketScope,
    totalBills,
    totalValue: round2(totalBillValue),
    avgBasket: totalBills ? round2(totalBillValue / totalBills) : 0,
    months: basketMonths,
    branches: basketBranchArr,
  };

  // ===== การเติบโตรายหมวดสินค้า =====
  const CATEGORY_RULES = [
    [/ทุเรียน/, "ทุเรียน"],
    [/มะม่วง/, "มะม่วง"],
    [/มะพร้าว/, "มะพร้าว"],
    [/ทองม้วน/, "ทองม้วน"],
    [/เยลล/, "เยลลี่"],
    [/ลูกอม/, "ลูกอม"],
    [/กาหยี|หิมพานต์|เม็ดมะม่วง/, "เม็ดมะม่วงหิมพานต์"],
    [/มะขาม/, "มะขาม"],
    [/น้ำผึ้ง/, "น้ำผึ้ง"],
    [/สาหร่าย/, "สาหร่าย"],
    [/สบู่|ยาสีฟัน|ยาหม่อง|ลิป|น้ำมัน|สมุนไพร|ครีม/, "ของใช้/สมุนไพร"],
  ];
  const categorize = (name) => {
    for (const [re, cat] of CATEGORY_RULES) if (re.test(name)) return cat;
    return "อื่นๆ";
  };
  const catMap = new Map(); // cat -> Map(monthKey -> value)
  for (const m of months) {
    for (const p of m.products) {
      const cat = categorize(p.name);
      const byMonth = catMap.get(cat) || new Map();
      byMonth.set(m.key, (byMonth.get(m.key) || 0) + p.value);
      catMap.set(cat, byMonth);
    }
  }
  const monthKeys = months.map((m) => ({ key: m.key, label: m.label }));
  const categories = [...catMap.entries()]
    .map(([name, byMonth]) => {
      const series = monthKeys.map((mk) => round2(byMonth.get(mk.key) || 0));
      return { name, total: round2(series.reduce((s, v) => s + v, 0)), series };
    })
    .sort((a, b) => b.total - a.total);

  // จำนวนวันในช่วงข้อมูล (สำหรับ เฉลี่ย/วัน)
  const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const periodDays = months.reduce((s, m) => {
    const ce = m.be ? m.be - 543 : 2026;
    const d = m.order === 2 && isLeap(ce) ? 29 : DAYS_IN_MONTH[m.order] || 30;
    return s + d;
  }, 0);

  const out = {
    generatedAt: new Date().toISOString(),
    source: "รายงานการขายหน้าร้าน - ตามสินค้า - ตามสาขา (.xls)",
    note: "ยอดขายเป็นมูลค่ารวมสุทธิ (รวมภาษี หลังหักส่วนลด)",
    grandValue,
    grandQty,
    monthCount: months.length,
    productCount: overall.size,
    branchCount: branchOverall.size,
    monthKeys: months.map((m) => ({ key: m.key, label: m.label })),
    periodDays,
    // months แบบ slim (ไม่มีรายละเอียดสินค้า/สาขา เพื่อลดขนาด) — รายละเอียดอยู่ใน public/monthly/<key>.json
    months: months.map((m) => ({
      key: m.key,
      order: m.order,
      be: m.be,
      label: m.label,
      totalQty: m.totalQty,
      totalValue: m.totalValue,
      productCount: m.productCount,
      branchCount: m.branchCount,
      branches: m.branches,
    })),
    topByValue,
    topByQty,
    branches,
    basket,
    categories,
    current,
  };

  // เขียนไฟล์รายเดือน (รายละเอียดสินค้า + แยกสาขา) ไว้ที่ public/monthly เพื่อโหลดเมื่อเลือก
  const MONTH_DIR = path.join(ROOT, "public", "monthly");
  fs.mkdirSync(MONTH_DIR, { recursive: true });
  for (const old of fs.readdirSync(MONTH_DIR)) {
    if (old.endsWith(".json")) fs.unlinkSync(path.join(MONTH_DIR, old));
  }
  for (const m of months) {
    fs.writeFileSync(
      path.join(MONTH_DIR, `${m.key}.json`),
      JSON.stringify({
        key: m.key,
        label: m.label,
        totalValue: m.totalValue,
        products: m.products,
      }),
    );
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log("เขียน", OUT, "+ public/monthly/*.json");
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
