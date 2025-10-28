'use client';

export type TemplateMode = 'ERP' | 'NON_ERP';

export default function TemplateToggle({
    mode,
    onModeChange,
    className,
}: {
    mode: TemplateMode;
    onModeChange: (m: TemplateMode) => void;
    className?: string;
}) {
    return (
        <div
            className={[
                'inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm',
                className,
            ].filter(Boolean).join(' ')}
            role="tablist"
            aria-label="Template mode"
        >
            {(['ERP', 'NON_ERP'] as TemplateMode[]).map((m) => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onModeChange(m)}
                        className={[
                            'px-3 py-1.5 text-xs font-medium rounded-full transition',
                            active ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50',
                        ].join(' ')}
                    >
                        {m === 'ERP' ? 'ERP' : 'Non-ERP'}
                    </button>
                );
            })}
        </div>
    );
}
