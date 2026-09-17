export type Sale = {
  id: string;
  sale_date: string; // YYYY-MM-DD
  product: string;
  quantity: number;
  price: number;
  total: number;
  note: string | null;
  created_at: string;
};
