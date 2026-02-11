import { hadExplicitAlphaToken } from "../culori/hadExplicitAlpha";
import { parseColor } from "../culori/parse";
import { formatColor } from "../formats/formatters";
import type { ConvertOptions } from "../formats/types";
import { findDeclarationColors } from "../matchers/cssDeclarationColorMatcher";

import { applyEdits, type Edit } from "./applyEdits";

export type ConvertTextResult = {
    output: string;
    editsApplied: number;
    errorColors: string[];
};

export function convertText(
    input: string,
    opts: ConvertOptions,
): ConvertTextResult {
    const matches = findDeclarationColors(input);

    if (matches.length === 0) {
        return { output: input, editsApplied: 0, errorColors: [] };
    }

    const errorColors: string[] = [];
    const edits: Edit[] = [];

    for (const m of matches) {
        const parsed = parseColor(m.color);
        if (!parsed) {
            errorColors.push(m.color);
            continue;
        }

        let converted: string;
        try {
            converted = formatColor(parsed, {
                ...opts,
                hadExplicitAlpha: hadExplicitAlphaToken(m.color),
            });
        } catch {
            errorColors.push(m.color);
            continue;
        }

        edits.push({
            start: m.index,
            end: m.index + m.fullMatch.length,
            replacement: m.fullMatch.replace(m.color, converted),
        });
    }

    if (edits.length === 0) {
        return { output: input, editsApplied: 0, errorColors };
    }

    edits.sort((a, b) => b.start - a.start);
    const output = applyEdits(input, edits);

    return { output, editsApplied: edits.length, errorColors };
}
