import * as vscode from 'vscode';
import { GuidePanel } from './panel';

export function activate(context: vscode.ExtensionContext) {
	console.log("Extension 'Guide' is now active!");
	//vscode.workspace.getConfiguration("files.associations").update("*.guide", "typescriptreact");

	let openCommand = vscode.commands.registerCommand('open.guide', (e: vscode.Uri) => {
		console.log("Opening Guide " + e);
		GuidePanel.createOrShow(e, context);
	});

	let watcher = vscode.workspace.createFileSystemWatcher("**/*.guide", true, false, false);
	let watcherDidChange = watcher.onDidChange((e) => {
		console.log("Guide changed, reloading. File: " + e);
		GuidePanel.update(e);
	});

	console.log("Extension Path" + context.extensionPath);

	context.subscriptions.push(openCommand);
	context.subscriptions.push(watcherDidChange);
}

export function deactivate() { }


