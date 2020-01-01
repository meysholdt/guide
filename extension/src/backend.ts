import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from "typescript";
import Module = require('module');


export class Backend {
    private _module: Module;

    constructor(sourceCode: string, filename: string) {
        let result = ts.transpileModule(sourceCode, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                jsx: ts.JsxEmit.React,
                noImplicitUseStrict:true
            }
        });
        const src = result.outputText;
        var m = new Module("foomodule");
        m.require = e => {
            console.log("Require " + e);
            let delegate = require(e);
            console.log("Delegated to " + delegate);
            delegate.default = delegate;
            return delegate;
        };
        eval("m._compile(src, filename)");
        this._module = m;
    }

    public activate(context: vscode.ExtensionContext) { }

    public deactivate() { }

    public listMessageFunctions(): Function[] {
        const result: Function[] = [];
        for (const key in this._module.exports) {
            const func = this._module.exports[key];
            if (func instanceof Function) {
                result.push(func);
            }
        }
        return result;
    }

    public invokeMessageFunction(name:string, args: any[]) {
        const func = this._module.exports[name] as Function;
        func.apply({}, args);
    }


}