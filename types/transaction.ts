export interface Transaction {
  _id: string;
  name: string; 
  transaction_date: string;
  supplier: string; 
  supplier_name: string; 
  status:  string; 
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  pi_name: string[];
  pr_name: string[]; 
}