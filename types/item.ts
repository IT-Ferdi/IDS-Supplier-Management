export interface StockWarehouse {
    warehouse: string;
    qty: number;
}

export interface ItemRow {
    id: string;             // e.g. MID-0001
    name: string;
    description?: string;
    brand?: string;
    uom?: string | null;
    category?: string;
    total_stock?: number;                 // total stock across warehouses
    stock_warehouse?: StockWarehouse[];   // per-warehouse breakdown
}

export type Item = ItemRow;
