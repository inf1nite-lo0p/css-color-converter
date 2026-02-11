import * as vscode from "vscode";

import type { TargetFormat } from "../formats/types";

export type ExtensionSettings = {
    precision: number;
    useOpacity: boolean;
    targetFormat: TargetFormat;
    promptForFormat: boolean;
};

export function getSettings(): ExtensionSettings {
    const cfg = vscode.workspace.getConfiguration();

    return {
        precision: clamp(cfg.get<number>("colorConverter.precision", 2), 0, 6),
        useOpacity: cfg.get<boolean>("colorConverter.useOpacity", true),
        targetFormat: cfg.get<TargetFormat>(
            "colorConverter.targetFormat",
            "oklch",
        ),
        promptForFormat: cfg.get<boolean>(
            "colorConverter.promptForFormat",
            false,
        ),
    };
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}
