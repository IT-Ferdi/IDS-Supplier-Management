// app/supplier/[id]/items/page.tsx
import React from 'react';
import SupplierItems from '@/components/supplier/supplier-items';

export default function Page({ params }: { params: { id: string } }) {
    return <SupplierItems supplierId={params.id} />;
}