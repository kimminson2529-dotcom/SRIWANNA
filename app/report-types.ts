export type BranchStat = { qty: number; value: number };

export type ReportProduct = {
  code: string;
  name: string;
  unit: string;
  qty: number;
  value: number;
  byBranch?: Record<string, BranchStat>;
};

export type ReportBranch = {
  code: string;
  name: string;
  qty: number;
  value: number;
};

export type ReportMonth = {
  key: string;
  order: number;
  be: number | null;
  label: string;
  totalQty: number;
  totalValue: number;
  productCount: number;
  branchCount: number;
  products?: ReportProduct[];
  branches: ReportBranch[];
};

export type BasketMonth = {
  key: string;
  order: number;
  be: number | null;
  label: string;
  bills: number;
  billTotal: number;
  avgBasket: number;
};

export type BasketBranch = {
  code: string;
  name: string;
  bills: number;
  value: number;
  avgBasket: number;
  months: BasketMonth[];
};

export type BasketSummary = {
  scope: string | null;
  totalBills: number;
  totalValue: number;
  avgBasket: number;
  months: BasketMonth[];
  branches: BasketBranch[];
};

export type Category = {
  name: string;
  total: number;
  series: number[]; // เรียงตาม monthKeys
};

export type MonthKey = { key: string; label: string };

export type CurrentMonth = {
  key: string;
  order: number;
  be: number | null;
  label: string;
  daysWithData: number;
  daysInMonth: number;
  value: number;
  qty: number;
  forecast: number;
  startDay: number;
};

export type SalesReport = {
  generatedAt: string;
  source: string;
  note: string;
  grandValue: number;
  grandQty: number;
  monthCount: number;
  productCount: number;
  branchCount: number;
  periodDays: number;
  monthKeys: MonthKey[];
  months: ReportMonth[];
  topByValue: ReportProduct[];
  topByQty: ReportProduct[];
  branches: ReportBranch[];
  basket: BasketSummary;
  categories: Category[];
  current: CurrentMonth | null;
};
