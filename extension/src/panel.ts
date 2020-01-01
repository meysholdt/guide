import * as vscode from 'vscode';
import { Frontend } from './frontend';
import { Backend } from './backend';
import * as code from './code';
import * as path from 'path';

export class GuidePanel {
	public static currentPanel: GuidePanel | undefined;
	public static readonly viewType = 'guide';

	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];
	private _context: vscode.ExtensionContext;
	private _frontend?: Frontend;
	private _backend?: Backend;

	public static createOrShow(sheetUri: vscode.Uri, context: vscode.ExtensionContext) {
		// If we already have a panel, show it.
		if (GuidePanel.currentPanel) {
			GuidePanel.currentPanel._panel.reveal();
			return;
		}
		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			GuidePanel.viewType,
			'Guide',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				enableCommandUris: true
			}
		);
		GuidePanel.currentPanel = new GuidePanel(context, panel, sheetUri);
	}

	private constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, sheetUri: vscode.Uri) {
		this._context = context;
		this._panel = panel;

		// Set the webview's initial html content
		this._update(sheetUri);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		// this._panel.onDidChangeViewState(
		// 	e => {
		// 		if (this._panel.visible) {
		// 			console.log("onDidChangeViewState: %o", e);
		// 			this._update(sheetUri);
		// 		}
		// 	},
		// 	null,
		// 	this._disposables
		// );

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				try {
					console.log("onDidReceiveMessage: %o", message);
					if (this._backend && this._frontend) {
						this._frontend.onDidReceiveMessage(this._backend, message);
					}
				} catch (e) {
					this._showError(e);
				}
			},
			null,
			this._disposables
		);
	}

	public static update(sheet: vscode.Uri) {
		if (GuidePanel.currentPanel) {
			GuidePanel.currentPanel._update(sheet);
		}
	}

	private _update(sheet: vscode.Uri) {
		try {
			this._panel.title = path.basename(sheet.path);
			if (this._backend) {
				this._backend.deactivate();
			}
			if (this._frontend) {
				this._frontend.dispose();
			}
			const { frontendSource, backendSource } = code.loadAndSplit(sheet);
			this._backend = new Backend(backendSource, sheet.path);
			this._frontend = new Frontend(frontendSource, this._panel.webview, this._context);
			const contents = this._frontend.toHtml(this._backend);
			console.log("html: " + contents);
			this._panel.webview.html = contents;
		} catch (e) {
			this._showError(e);
		}
	}

	_showError(e: any) {
		console.log(e);
		if (e instanceof Error) {
			this._panel.webview.html = `<p>${e.message}</p><pre>${e.stack}</pre>`;
		} else {
			this._panel.webview.html = `<p>${e}</p>`;
		}
	}

	public dispose() {
		GuidePanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

}