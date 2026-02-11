export type TargetFormat =
    | "oklch"
    | "oklab"
    | "lch"
    | "lab"
    | "rgb"
    | "hsl"
    | "hex";

export type ConvertOptions = {
    targetFormat: TargetFormat;
    precision: number;

    /**
     * When true, include alpha only if it was explicitly present in the source token,
     * or if alpha < 1. This avoids generating "/ 1" noise.
     */
    useOpacity: boolean;

    /**
     * True when the original color token had an explicit alpha (e.g. "/ 0.5", "rgba(...)", "#rrggbbaa").
     */
    hadExplicitAlpha: boolean;
};
