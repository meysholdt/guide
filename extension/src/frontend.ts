import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from "typescript";
import Module = require('module');
import { Component, ReactNode } from 'react';
import { Backend } from './backend';

export class Frontend {
    private _impl: string;
    private _reactInWebView: vscode.Uri;

    constructor(source: string, view: vscode.Webview, context: vscode.ExtensionContext) {
        let result = ts.transpileModule(source, {
            compilerOptions: {
                module: ts.ModuleKind.ESNext,
                jsx: ts.JsxEmit.React
            }
        });
        console.log("compiled:\n" + result.outputText);

        const reactOnDiskPath = vscode.Uri.file(
            path.join(context.extensionPath, 'node_modules', 'es-react', 'index.js')
        );
        this._reactInWebView = view.asWebviewUri(reactOnDiskPath);
        this._impl = result.outputText.replace("from 'react';", `from '${this._reactInWebView}';`);
    }


    public toHtml(backend: Backend): string {
        // generate backedn stubs
        let stubs: string[] = [];
        for (const func of backend.listMessageFunctions()) {
            //Reflect.
            //if (func.arguments) {
                // for (const a of func.arguments) {
                    // console.log("Argument:" + a);
                // }
            // }
            stubs.push(`
                function ${func.name}(...args) {
                    console.log("Calling ${func.name} with args:"+args);
                    let message = {
                        functionname: '${func.name}',
                        args: []
                    };
                    for (var a of args) {
                      if(["number", "string"].includes(typeof a)) {
                        message.args.push(a);
                      }
                    }
                    vscode.postMessage(message);
                }
            `);
        }

        // code gen
        return `
<script type="module">
    let exports = [];
    const vscode = acquireVsCodeApi();
    ${stubs.join("\n")}
    ${this._impl}
    import { ReactDOM } from '${this._reactInWebView}';
    let rendered = render();
    ReactDOM.render(rendered, document.body);
</script>
    `;
    }

    public onDidReceiveMessage(backend: Backend, message: any) {
        if (message && message.functionname) {
            const args = message.args ? message.args : [];
            backend.invokeMessageFunction(message.functionname, args);
        }
    }

    public dispose() { }


}