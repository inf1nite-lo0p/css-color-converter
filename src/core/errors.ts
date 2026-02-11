import * as vscode from "vscode";

export function showErrorMessages(errorColors: string[]): void {
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
