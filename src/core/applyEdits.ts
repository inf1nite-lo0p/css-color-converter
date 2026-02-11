export type Edit = { start: number; end: number; replacement: string };

export function applyEdits(input: string, edits: Edit[]): string {
    let out = input;
    for (const e of edits) {
        out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
    }
    return out;
}
