// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TimeTracker from './TimeTracker';

let tracker: TimeTracker | null = null;

export function activate(context: vscode.ExtensionContext) {
	tracker = new TimeTracker(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
	tracker?.stopTask("VSCode exited");
}

