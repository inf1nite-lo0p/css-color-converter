import * as vscode from "vscode";

import { convertSelectionOrDocument } from "./commands/convertSelectionOrDocument";

export function activate(context: vscode.ExtensionContext) {
    const run = () => convertSelectionOrDocument();

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "colorConverter.convertSelectionOrDocument",
            run,
        ),
    );
}

export function deactivate() {}
