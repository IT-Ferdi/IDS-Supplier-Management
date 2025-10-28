'use client';

import * as React from 'react';
import TextField from '@/components/ui/text-field';

export interface TechnicalDataValue {
    datasheetUrl: string;
    drawingUrl: string;
    mainDimension: string;    // dimensi, ukuran, material utama (required)
    dimTolerance: string;
    weight: string;
    workTempPressure: string; // temperatur kerja / tekanan kerja
    materialCompatibility: string;
}

export interface TechnicalDataSectionProps {
    value: TechnicalDataValue;
    onChange: (patch: Partial<TechnicalDataValue>) => void;
    errors?: Partial<Record<keyof TechnicalDataValue, string>>;
    className?: string;
}

export default function TechnicalDataSection({
    value,
    onChange,
    errors,
    className,
}: TechnicalDataSectionProps) {
    return (
        <section
            className={['space-y-4 rounded-2xl border bg-white p-5', className].filter(Boolean).join(' ')}
        >
            <header>
                <h2 className="text-lg font-semibold">Technical Data</h2>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextField
                    label="Data sheet link"
                    placeholder="https://contoh.com/datasheet.pdf"
                    value={value.datasheetUrl}
                    onChange={(e) => onChange({ datasheetUrl: e.target.value })}
                    inputMode="url"
                    autoComplete="url"
                    error={errors?.datasheetUrl}
                />

                <div className="md:col-span-1">
                    <TextField
                        label="Link drawing"
                        placeholder="https://contoh.com/drawing"
                        value={value.drawingUrl}
                        onChange={(e) => onChange({ drawingUrl: e.target.value })}
                        inputMode="url"
                        autoComplete="url"
                        error={errors?.drawingUrl}
                    />
                </div>

                <div className="md:col-span-2">
                    <TextField
                        label="Dimensi, ukuran, material utama"
                        requiredMark
                        placeholder="Contoh: ID 750mm × OD 910mm × Tinggi 90mm — Material: SS304"
                        value={value.mainDimension}
                        onChange={(e) => onChange({ mainDimension: e.target.value })}
                        hint="Contoh: ID 750MM × OD 910MM × TINGGI 90MM"
                        error={errors?.mainDimension}
                    />
                </div>

                <TextField
                    label="Toleransi dimensi"
                    placeholder="±0.05 mm"
                    value={value.dimTolerance}
                    onChange={(e) => onChange({ dimTolerance: e.target.value })}
                    error={errors?.dimTolerance}
                />

                <TextField
                    label="Berat"
                    placeholder="Mis. 12.5 kg"
                    value={value.weight}
                    onChange={(e) => onChange({ weight: e.target.value })}
                    inputMode="decimal"
                    autoComplete="off"
                    error={errors?.weight}
                />

                <TextField
                    label="Temperatur kerja / tekanan kerja"
                    placeholder="Mis. 120°C / 8 bar"
                    value={value.workTempPressure}
                    onChange={(e) => onChange({ workTempPressure: e.target.value })}
                    error={errors?.workTempPressure}
                />

                <TextField
                    label="Kompatibilitas bahan"
                    placeholder="Mis. kompatibel dengan stainless, NBR, EPDM"
                    value={value.materialCompatibility}
                    onChange={(e) => onChange({ materialCompatibility: e.target.value })}
                    error={errors?.materialCompatibility}
                />
            </div>
        </section>
    );
}
