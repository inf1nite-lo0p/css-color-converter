import * as vscode from "vscode";

import { getSettings } from "../config/settings";
import { applyEdits, type Edit } from "../core/applyEdits";
import { showErrorMessages } from "../core/errors";
import { hadExplicitAlphaToken } from "../culori/hadExplicitAlpha";
import { parseColor } from "../culori/parse";
import { formatColor } from "../formats/formatters";
import type { TargetFormat } from "../formats/types";
import { findDeclarationColors } from "../matchers/cssDeclarationColorMatcher";

export async function convertSelectionOrDocument(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const doc = editor.document;
    const selection = editor.selection;

    const hasSelection =
        !selection.isEmpty && selection.start.line !== selection.end.line
            ? true
            : !selection.isEmpty;

    const range = hasSelection
        ? new vscode.Range(selection.start, selection.end)
        : new vscode.Range(
              doc.positionAt(0),
              doc.positionAt(doc.getText().length),
          );

    const text = doc.getText(range);
    const matches = findDeclarationColors(text);

    if (matches.length === 0) {
        vscode.window.showInformationMessage(
            "No color declarations found in the selection/document.",
        );
        return;
    }

    const settings = getSettings();

    const targetFormat = settings.promptForFormat
        ? await pickTargetFormat(settings.targetFormat)
        : settings.targetFormat;

    if (!targetFormat) {
        return;
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
                targetFormat,
                precision: settings.precision,
                useOpacity: settings.useOpacity,
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
        vscode.window.showInformationMessage(
            "Found color declarations, but none could be converted.",
        );
        if (errorColors.length) {
            showErrorMessages(errorColors);
        }
        return;
    }

    edits.sort((a, b) => b.start - a.start);
    const updated = applyEdits(text, edits);

    await editor.edit((editBuilder) => {
        editBuilder.replace(range, updated);
    });

    if (errorColors.length) {
        showErrorMessages(errorColors);
    }
}

async function pickTargetFormat(
    current: TargetFormat,
): Promise<TargetFormat | undefined> {
    const items: {
        label: string;
        format: TargetFormat;
        description: string;
    }[] = [
        { label: "oklch()", format: "oklch", description: "Perceptual OKLCH" },
        { label: "oklab()", format: "oklab", description: "Perceptual OKLab" },
        { label: "lch()", format: "lch", description: "CIELCH" },
        { label: "lab()", format: "lab", description: "CIELAB" },
        { label: "rgb()", format: "rgb", description: "RGB functional syntax" },
        { label: "hsl()", format: "hsl", description: "HSL functional syntax" },
        {
            label: "#rrggbb[aa]",
            format: "hex",
            description: "Hex (optionally with alpha)",
        },
    ];

    const picked = await vscode.window.showQuickPick(items, {
        title: "Convert colors to",
        canPickMany: false,
        placeHolder: `Current: ${current}`,
    });

    return picked?.format;
}
