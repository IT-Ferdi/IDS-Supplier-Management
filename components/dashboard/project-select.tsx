'use client';

import React from 'react';

type Option = { label: string; value: string };

export default function ProjectSelect({
    value,
    onChange,
    projects,
    placeholder = 'Select project',
}: {
    value: string | null;
    onChange: (v: string | null) => void;
    projects: Option[]; // [{ label, value }]
    placeholder?: string;
}) {
    return (
        <div className="inline-block">
            <label className="sr-only">Project</label>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value ? e.target.value : null)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-sky-300"
            >
                <option value="">{placeholder}</option>
                {projects.map((p) => (
                    <option key={p.value} value={p.value}>
                        {p.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
