'use client';

import * as React from 'react';

type StarRatingProps = {
    value?: number;
    onChange?: (next: number) => void;
    max?: number;
    step?: 0.5 | 1;
    size?: number;
    disabled?: boolean;
    readOnly?: boolean;
    name?: string;
    className?: string;
    'aria-label'?: string;
};

export default function StarRating({
    value = 0,
    onChange,
    max = 5,
    step = 0.5,
    size = 28,
    disabled = false,
    readOnly = false,
    name,
    className,
    'aria-label': ariaLabel,
}: StarRatingProps) {
    const [hover, setHover] = React.useState<number | null>(null);
    const isInteractive = !disabled && !readOnly && typeof onChange === 'function';

    const current = clamp(hover ?? value, 0, max);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive) return;
        if (['ArrowRight', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            onChange!(clamp(roundTo(value + step, step), 0, max));
        } else if (['ArrowLeft', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            onChange!(clamp(roundTo(value - step, step), 0, max));
        } else if (e.key === 'Home') {
            e.preventDefault();
            onChange!(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            onChange!(max);
        }
    };

    return (
        <div
            role={isInteractive ? 'slider' : undefined}
            aria-label={ariaLabel ?? 'Rating'}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Number.isFinite(current) ? Number(current.toFixed(1)) : 0}
            aria-valuetext={`${current.toFixed(1)} of ${max}`}
            aria-readonly={readOnly || undefined}
            aria-disabled={disabled || undefined}
            tabIndex={isInteractive ? 0 : -1}
            onKeyDown={handleKeyDown}
            className={`inline-flex items-center gap-1 ${className ?? ''} ${disabled ? 'opacity-60' : ''}`}
            onMouseLeave={() => setHover(null)}
        >
            {/* penting: hidden input pakai nilai committed, bukan hover */}
            {name ? <input type="hidden" name={name} value={String(value)} /> : null}

            {Array.from({ length: max }).map((_, i) => {
                const index = i + 1; // 1..max
                const fillUnit = clamp(current - (index - 1), 0, 1); // porsi bintang yang terisi 0..1

                return (
                    <StarButton
                        key={index}
                        index={index}
                        size={size}
                        fill={fillUnit}
                        step={step}
                        max={max}         
                        isInteractive={isInteractive}
                        onHover={(v) => setHover(v)}
                        onCommit={(v) => onChange?.(v)}
                        disabled={disabled}
                    />
                );
            })}

            <span className="ml-1 text-sm text-slate-500">{current.toFixed(1)}</span>
        </div>
    );
}

/* -------------------- Subcomponent -------------------- */
function StarButton({
    index,
    size,
    fill, // 0..1
    step,
    max,
    isInteractive,
    onHover,
    onCommit,
    disabled,
}: {
    index: number;
    size: number;
    fill: number;
    step: 0.5 | 1;
    max: number;
    isInteractive: boolean;
    onHover: (v: number | null) => void;
    onCommit: (v: number) => void;
    disabled?: boolean;
}) {
    const btnRef = React.useRef<HTMLButtonElement | null>(null);

    const computeValueFromPointer = (clientX: number) => {
        const rect = btnRef.current!.getBoundingClientRect();
        const rel = clamp((clientX - rect.left) / rect.width, 0, 1); // 0..1
        const stepUnit = step === 0.5 ? 0.5 : 1;
        const portion = roundTo(rel, stepUnit); // 0 | 0.5 | 1 (kalau step 0.5)
        const starPortion = portion === 0 ? (step === 0.5 ? 0.5 : 1) : portion;
        const next = index - 1 + starPortion;
        return clamp(next, 0, max);           // ← jangan hardcode 5
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isInteractive) return;
        onHover(computeValueFromPointer(e.clientX));
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
        if (!isInteractive) return;
        const touch = e.touches[0];
        if (!touch) return;
        onHover(computeValueFromPointer(touch.clientX));
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isInteractive) return;
        onCommit(computeValueFromPointer(e.clientX));
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
        if (!isInteractive) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        onCommit(computeValueFromPointer(touch.clientX));
    };

    return (
        <button
            ref={btnRef}
            type="button"
            disabled={!isInteractive || disabled}
            aria-label={`${index} star`}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={handleClick}
            onTouchEnd={handleTouchEnd}
            className={`relative inline-flex select-none items-center justify-center outline-none ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ width: size, height: size, lineHeight: 0, touchAction: 'none' }}
        >
            {/* outline */}
            <StarIcon className="absolute inset-0" size={size} strokeWidth={1.5} stroke="currentColor" fill="none" />
            {/* fill (mask) */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.round(fill * 100)}%` }}>
                <StarIcon className="text-amber-400" size={size} stroke="none" fill="currentColor" />
            </div>
            {/* base grey */}
            <StarIcon className="text-slate-300" size={size} stroke="none" fill="currentColor" />
            {/* focus ring */}
            {isInteractive ? (
                <span className="absolute -inset-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" />
            ) : null}
        </button>
    );
}

/* -------------------- Icon & utils -------------------- */
function StarIcon({
    size,
    className,
    stroke = 'none',
    strokeWidth = 1,
    fill = 'currentColor',
}: {
    size: number;
    className?: string;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
}) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
            <path
                d="M12 3.5l2.834 5.743 6.34.922-4.587 4.47 1.083 6.315L12 18.84 6.33 20.95l1.083-6.315L2.826 10.17l6.34-.922L12 3.5z"
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
            />
        </svg>
    );
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}
function roundTo(n: number, step: number) {
    const inv = 1 / step;
    return Math.round(n * inv) / inv;
}
