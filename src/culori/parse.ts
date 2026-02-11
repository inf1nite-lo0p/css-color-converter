import * as culori from "culori";

export type CuloriColor = culori.Color;

export function parseColor(input: string): CuloriColor | undefined {
    return culori.parse(input);
}
