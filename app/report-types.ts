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
};
