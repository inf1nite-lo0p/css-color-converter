import * as culori from "culori";
import * as vscode from "vscode";

type ConvertResult = { original: string; converted: string };

const NAMED_COLORS =
    "(?:aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)";

const HEX_COLOR = "#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b";

// Keep these strict-ish, but we’ll also allow generic function colors below
const RGB_COLOR =
    "rgba?\\(\\s*\\d{1,3}(?:\\s*,\\s*|\\s+)\\d{1,3}(?:\\s*,\\s*|\\s+)\\d{1,3}(?:\\s*(?:\\/|,)\\s*\\d?\\.?\\d+%?)?\\s*\\)";

// We deliberately match function forms broadly and let culori.parse validate.
// This catches Tailwind space-separated hsl/rgb and also future syntaxes.
const FUNCTION_COLOR =
    "(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\([^\\)]*\\)";

const PROP_NAME = "(?:--[a-zA-Z0-9-_]+|[a-zA-Z-]+)";

// Only match: <prop>: <color> followed by ; or }
const colorRegex = new RegExp(
    `${PROP_NAME}\\s*:\\s*(${NAMED_COLORS}|${HEX_COLOR}|${RGB_COLOR}|${FUNCTION_COLOR})(?=\\s*;|\\s*\\})`,
    "gi",
);

export function activate(context: vscode.ExtensionContext) {
    console.log("OKLCH Converter activated");
    const disposable = vscode.commands.registerCommand(
        "oklchConverter.convertSelectionOrDocument",
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const doc = editor.document;
            const selection = editor.selection;

            const hasSelection =
                !selection.isEmpty &&
                selection.start.line !== selection.end.line
                    ? true
                    : !selection.isEmpty;

            const range = hasSelection
                ? new vscode.Range(selection.start, selection.end)
                : new vscode.Range(
                      doc.positionAt(0),
                      doc.positionAt(doc.getText().length),
                  );

            const text = doc.getText(range);
            const matches = Array.from(text.matchAll(colorRegex));
            if (matches.length === 0) {
                vscode.window.showInformationMessage(
                    "No color declarations found in the selection/document.",
                );
                return;
            }

            const errorColors: string[] = [];
            const edits: { start: number; end: number; replacement: string }[] =
                [];

            for (const match of matches) {
                const fullMatch = match[0];
                const colorStr = match[1];
                const idx = match.index ?? -1;
                if (idx < 0) {
                    continue;
                }

                const converted = convertToOklch(colorStr, errorColors);
                if (!converted) {
                    continue;
                }

                // Preserve the left side (<prop>: ) exactly as it appeared.
                // Replace only the color token inside fullMatch.
                const replacement = fullMatch.replace(
                    colorStr,
                    converted.converted,
                );

                edits.push({
                    start: idx,
                    end: idx + fullMatch.length,
                    replacement,
                });
            }

            if (edits.length === 0) {
                vscode.window.showInformationMessage(
                    "Found color declarations, but none could be converted.",
                );
                if (errorColors.length) {
                    showErrorMessages(errorColors);
                }
                return;
            }

            // Apply from back to front so indices stay valid
            edits.sort((a, b) => b.start - a.start);

            const updated = applyEdits(text, edits);

            await editor.edit((editBuilder) => {
                editBuilder.replace(range, updated);
            });

            if (errorColors.length) {
                showErrorMessages(errorColors);
            }
        },
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function applyEdits(
    input: string,
    edits: { start: number; end: number; replacement: string }[],
): string {
    let out = input;
    for (const e of edits) {
        out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
    }
    return out;
}

function convertToOklch(
    colorStr: string,
    errorColors: string[],
): ConvertResult | undefined {
    try {
        const parsed = culori.parse(colorStr);
        if (!parsed) {
            throw new Error("culori.parse failed");
        }

        // Ensure alpha exists
        const alpha = (parsed as any).alpha ?? 1;

        const oklch = culori.oklch(parsed);
        if (!oklch) {
            throw new Error("culori.oklch failed");
        }

        const cfg = vscode.workspace.getConfiguration();
        const useOpacity = cfg.get<boolean>("oklchConverter.useOpacity", true);
        const precision = clamp(
            cfg.get<number>("oklchConverter.precision", 2),
            0,
            6,
        );

        // culori uses l in 0..1; CSS oklch() expects percent
        const lPct = (oklch.l ?? 0) * 100;

        const c = oklch.c ?? 0;
        const h = Number.isFinite(oklch.h as number) ? (oklch.h as number) : 0;

        const alphaPart =
            useOpacity || alpha < 1
                ? ` / ${formatNumber(alpha, precision)}`
                : "";

        return {
            original: colorStr,
            converted: `oklch(${formatNumber(lPct, precision)}% ${formatNumber(
                c,
                precision,
            )} ${formatNumber(h, precision)}${alphaPart})`,
        };
    } catch {
        errorColors.push(colorStr);
        return undefined;
    }
}

function formatNumber(value: number, precision: number): string {
    // avoid "-0"
    const fixed = value.toFixed(precision);
    const trimmed =
        precision > 0
            ? fixed.replace(/\.?0+$/, "")
            : fixed.replace(/\.0+$/, "");
    return trimmed === "-0" ? "0" : trimmed;
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

function showErrorMessages(errorColors: string[]): void {
    const maxErrorsToShow = 80;
    const displayed = errorColors.slice(0, maxErrorsToShow).join(", ");
    vscode.window
        .showErrorMessage(
            `Cannot convert ${errorColors.length} color(s). ${displayed}`,
            "View List",
        )
        .then((selection) => {
            if (selection === "View List") {
                const content = errorColors.join("\n");
                vscode.workspace
                    .openTextDocument({ content, language: "plaintext" })
                    .then((doc) => vscode.window.showTextDocument(doc));
            }
        });
}
