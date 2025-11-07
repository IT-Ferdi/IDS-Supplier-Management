// components/item/add-mid-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import NonErpItemSection from '@/components/item/forms/non-erp-item-section';

export default function AddMidForm() {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto p-6">
            <NonErpItemSection
                api="/api/item" // endpoint target
                onSaved={() => {
                    router.push('/item');
                }}
                onCancel={() => {
                    router.back();
                }}
            // uomOptions (fallback) opsional—hook useUomData tetap dipakai sebagai sumber utama
            // uomOptions={['Pcs', 'Unit', 'Kg', 'Ltr', 'Box']}
            />
        </div>
    );
}
