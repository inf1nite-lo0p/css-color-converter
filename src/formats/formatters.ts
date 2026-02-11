import * as culori from "culori";

import type { CuloriColor } from "../culori/parse";
import { clamp01, formatNumber, toHex2 } from "../utils/number";

import type { ConvertOptions, TargetFormat } from "./types";

type Formatter = (color: CuloriColor, opts: ConvertOptions) => string;

export function formatColor(color: CuloriColor, opts: ConvertOptions): string {
    const formatter = FORMATTERS[opts.targetFormat];
    return formatter(color, opts);
}

const FORMATTERS: Record<TargetFormat, Formatter> = {
    oklch: formatOklch,
    oklab: formatOklab,
    lch: formatLch,
    lab: formatLab,
    rgb: formatRgb,
    hsl: formatHsl,
    hex: formatHex,
};

function alphaSuffix(alpha: number, opts: ConvertOptions): string {
    // Always include if alpha < 1 (otherwise you'd change meaning).
    if (alpha < 1) {
        return ` / ${formatNumber(alpha, opts.precision)}`;
    }

    // Only include "/ 1" if user wants opacity and it was explicitly present in source.
    if (opts.useOpacity && opts.hadExplicitAlpha) {
        return ` / ${formatNumber(alpha, opts.precision)}`;
    }

    return "";
}

function formatOklch(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.oklch(color);
    if (!v) {
        throw new Error("culori.oklch failed");
    }

    const lPct = (v.l ?? 0) * 100;
    const c = v.c ?? 0;
    const h = Number.isFinite(v.h ?? Number.NaN) ? (v.h as number) : 0;

    const a = v.alpha ?? 1;
    return `oklch(${formatNumber(lPct, opts.precision)}% ${formatNumber(c, opts.precision)} ${formatNumber(h, opts.precision)}${alphaSuffix(a, opts)})`;
}

function formatOklab(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.oklab(color);
    if (!v) {
        throw new Error("culori.oklab failed");
    }

    const l = v.l ?? 0;
    const a = v.a ?? 0;
    const b = v.b ?? 0;

    const alpha = v.alpha ?? 1;
    return `oklab(${formatNumber(l, opts.precision)} ${formatNumber(a, opts.precision)} ${formatNumber(b, opts.precision)}${alphaSuffix(alpha, opts)})`;
}

function formatLch(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.lch(color);
    if (!v) {
        throw new Error("culori.lch failed");
    }

    const l = v.l ?? 0;
    const c = v.c ?? 0;
    const h = Number.isFinite(v.h ?? Number.NaN) ? (v.h as number) : 0;

    const alpha = v.alpha ?? 1;
    return `lch(${formatNumber(l, opts.precision)} ${formatNumber(c, opts.precision)} ${formatNumber(h, opts.precision)}${alphaSuffix(alpha, opts)})`;
}

function formatLab(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.lab(color);
    if (!v) {
        throw new Error("culori.lab failed");
    }

    const l = v.l ?? 0;
    const a = v.a ?? 0;
    const b = v.b ?? 0;

    const alpha = v.alpha ?? 1;
    return `lab(${formatNumber(l, opts.precision)} ${formatNumber(a, opts.precision)} ${formatNumber(b, opts.precision)}${alphaSuffix(alpha, opts)})`;
}

function formatRgb(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.rgb(color);
    if (!v) {
        throw new Error("culori.rgb failed");
    }

    const r = Math.round(clamp01(v.r ?? 0) * 255);
    const g = Math.round(clamp01(v.g ?? 0) * 255);
    const b = Math.round(clamp01(v.b ?? 0) * 255);

    const alpha = v.alpha ?? 1;
    return `rgb(${r} ${g} ${b}${alphaSuffix(alpha, opts)})`;
}

function formatHsl(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.hsl(color);
    if (!v) {
        throw new Error("culori.hsl failed");
    }

    const h = Number.isFinite(v.h ?? Number.NaN) ? (v.h as number) : 0;
    const sPct = clamp01(v.s ?? 0) * 100;
    const lPct = clamp01(v.l ?? 0) * 100;

    const alpha = v.alpha ?? 1;
    return `hsl(${formatNumber(h, opts.precision)} ${formatNumber(sPct, opts.precision)}% ${formatNumber(lPct, opts.precision)}%${alphaSuffix(alpha, opts)})`;
}

function formatHex(color: CuloriColor, opts: ConvertOptions): string {
    const v = culori.rgb(color);
    if (!v) {
        throw new Error("culori.rgb failed");
    }

    const r = Math.round(clamp01(v.r ?? 0) * 255);
    const g = Math.round(clamp01(v.g ?? 0) * 255);
    const b = Math.round(clamp01(v.b ?? 0) * 255);

    const alpha = v.alpha ?? 1;
    const includeAlpha = opts.useOpacity || alpha < 1;

    const rr = toHex2(r);
    const gg = toHex2(g);
    const bb = toHex2(b);

    if (!includeAlpha) {
        return `#${rr}${gg}${bb}`;
    }

    const aa = toHex2(Math.round(clamp01(alpha) * 255));
    return `#${rr}${gg}${bb}${aa}`;
}
