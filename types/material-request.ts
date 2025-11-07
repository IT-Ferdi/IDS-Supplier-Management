// types/material-request.ts
export interface MaterialRequestItem {
    detail_name: string;
    idx: number;
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    project: string;
    cost_center: string;
    department: string;
    ordered_qty: number; 
    received_qty: number;
}

export interface MaterialRequest {
    _id: string;
    name: string;
    transaction_date: string; // format YYYY-MM-DD
    purpose: string;
    status: string;
    required_by: string;
    cost_center: string;
    department: string;
    items: MaterialRequestItem[];
}
