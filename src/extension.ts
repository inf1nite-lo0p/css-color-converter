import * as vscode from "vscode";

import { convertSelectionOrDocument } from "./commands/convertSelectionOrDocument";

export function activate(context: vscode.ExtensionContext) {
    console.log("CSS Color Converter activated");

    const run = () => convertSelectionOrDocument();

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "colorConverter.convertSelectionOrDocument",
            run,
        ),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "oklchConverter.convertSelectionOrDocument",
            run,
        ),
    );
}

export function deactivate() {}
