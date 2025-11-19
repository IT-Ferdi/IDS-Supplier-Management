// types/material-request.ts
export interface MaterialRequestItem {
    detail_name: string;
    idx: number;

    // identifier
    item_code: string;
    item_name: string;

    // requested qty
    qty: number;
    uom: string;

    // classification
    project: string;
    cost_center: string;
    department: string;

    // legacy fields (kept optional for backward compatibility)
    ordered_qty?: number;   // DEPRECATED — prefer qty_total_po
    received_qty?: number;  // DEPRECATED — prefer qty_total_po

    // NEW single source of truth for accumulated PO quantity
    qty_total_po: number;

    // po details array (each push when PO created)
    // structure: { po_name, transaction_date, supplier, qty, uom }
    po_detail?: Array<{
        po_name?: string;
        transaction_date?: string;
        supplier?: string;
        qty?: number;
        uom?: string;
    }>;

    // warehouse info (optional)
    warehouse: string;

    // flag set when this MR item has been included in PO (optional)
    is_po?: boolean;
}

export interface MaterialRequest {
    _id: string;
    name: string;
    transaction_date: string;
    purpose: string;
    status: string;
    required_by: string;
    cost_center: string;
    department: string;
    items: MaterialRequestItem[];
}
