export type ReportProduct = {
  code: string;
  name: string;
  unit: string;
  qty: number;
  value: number;
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
  products: ReportProduct[];
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

export type BasketSummary = {
  scope: string | null;
  totalBills: number;
  totalValue: number;
  avgBasket: number;
  months: BasketMonth[];
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
  months: ReportMonth[];
  topByValue: ReportProduct[];
  topByQty: ReportProduct[];
  branches: ReportBranch[];
  basket: BasketSummary;
};
