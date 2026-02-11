import type { CuloriColor } from "./parse";

export function getAlpha(color: CuloriColor): number {
    return color.alpha ?? 1;
}
