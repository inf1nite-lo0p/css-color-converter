export function formatNumber(value: number, precision: number): string {
    const fixed = value.toFixed(precision);
    const trimmed =
        precision > 0
            ? fixed.replace(/\.?0+$/, "")
            : fixed.replace(/\.0+$/, "");
    return trimmed === "-0" ? "0" : trimmed;
}

export function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

export function clamp01(n: number): number {
    return clamp(n, 0, 1);
}

export function toHex2(n: number): string {
    return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
}
