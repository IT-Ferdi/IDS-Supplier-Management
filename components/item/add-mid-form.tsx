'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import MaterialDatasheetSection, {
    MaterialDatasheetValue,
    MaterialDatasheetErrors,
} from '@/components/item/forms/material-datasheet-section';
import TechnicalDataSection, { TechnicalDataValue } from '@/components/item/forms/technical-data-section';
import MaterialUsageSection, { MaterialUsageValue } from '@/components/item/forms/material-usage-section';
import { useState } from 'react';

const EMPTY: MaterialDatasheetValue = {
    materialName: '',
    brand: '',
    photo: null,
};

export default function AddMidForm() {
    const [value, setValue] = React.useState<MaterialDatasheetValue>(EMPTY);
    const [errors, setErrors] = React.useState<MaterialDatasheetErrors>({});

    const patch = (p: Partial<MaterialDatasheetValue>) =>
        setValue((v) => ({ ...v, ...p }));

    const validate = (): boolean => {
        const e: MaterialDatasheetErrors = {};
        if (!value.materialName.trim()) e.materialName = 'Wajib diisi';
        if (!value.brand.trim()) e.brand = 'Wajib diisi';
        if (!value.photo) e.photo = 'Wajib upload foto';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        // contoh kirim FormData
        const fd = new FormData();
        fd.append('materialName', value.materialName);
        fd.append('brand', value.brand);
        if (value.photo) fd.append('photo', value.photo);

        // TODO: panggil API-mu di sini
        alert('Submit MID:\n' + JSON.stringify({
            materialName: value.materialName,
            brand: value.brand,
            photo: value.photo?.name,
        }, null, 2));
    };

    const [tech, setTech] = useState<TechnicalDataValue>({
        datasheetUrl: '',
        drawingUrl: '',
        mainDimension: '',
        dimTolerance: '',
        weight: '',
        workTempPressure: '',
        materialCompatibility: '',
    });

    const [usage, setUsage] = useState<MaterialUsageValue>({
        usageNote: '',
    });

    const handleReset = () => {
        setValue(EMPTY);
        setErrors({});
    };

    return (
        <main className="p-4">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">Tambah Item</h1>

                <MaterialDatasheetSection
                    value={value}
                    onChange={patch}
                    errors={errors}
                    className="shadow-sm"
                />

                <TechnicalDataSection
                    value={tech}
                    onChange={(patch) => setTech((v) => ({ ...v, ...patch }))}
                    className="shadow-sm"
                />

                <MaterialUsageSection
                    value={usage}
                    onChange={(patch) => setUsage((v) => ({ ...v, ...patch }))}
                    className="shadow-sm"
                />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button onClick={handleSubmit}>Simpan</Button>
                </div>
            </div>
        </main>
    );
}
