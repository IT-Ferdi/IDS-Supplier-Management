// types/transaction.ts

export type TransactionItem = {
  detail_name?: string | null;
  idx?: number | null;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  uom?: string | null;
};

export interface Transaction {
  _id: string;
  name: string;
  transaction_date: string; // format "YYYY-MM-DD" atau ISO
  supplier: string; // supplier id
  supplier_name?: string;
  status?: string;
  items: TransactionItem[];
  // optional legacy fields (tetap boleh ada, tapi tidak dipakai jika items tersedia)
  item_code?: string;
  item_name?: string;
  qty?: number;
  rate?: number;
  pi_name?: string[];
  pr_name?: string[];
}

/** Bentuk hasil flatten (satu baris per item) */
export type TransactionLine = {
  _id: string;
  name: string;
  transaction_date: string;
  supplier: string;
  supplier_name?: string;
  status?: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  uom?: string | null;
};
