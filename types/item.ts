export interface ItemRow {
    id: string;             // e.g. MID-0001
    name: string;
    description?: string;
    brand?: string;
    uom?: string | null;
    category?: string;
}

export type Item = {
    id: string;       
    name: string;
    description?: string;
    brand?: string;
    uom?: string | null;
    category?: string;
}
