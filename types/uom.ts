// types/uom.ts
export interface UomDoc {
    _id?: string;
    creation?: string | null;
    owner?: string | null;
    modified?: string | null;
    modified_by?: string | null;

    id: string; 
    name: string;
}

export interface UomRow {
    id: string;   
    name: string; 
}
