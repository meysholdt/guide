import * as vscode from 'vscode';
import * as fs from 'fs';

export function loadAndSplit(sheetUri: vscode.Uri): { frontendSource: string, backendSource: string } {
    const contents = fs.readFileSync(sheetUri.fsPath, 'utf8');
    const indexOfSplitMarker = contents.indexOf("import React");
    const indexOfLineBeforeSplitMarker = contents.lastIndexOf('\n', indexOfSplitMarker);
    const frontendStartIndex = indexOfLineBeforeSplitMarker >= 0 ? indexOfLineBeforeSplitMarker : 0;
    const backendSource = contents.substr(0, frontendStartIndex);
    const frontendSource = contents.substr(frontendStartIndex);
    return { frontendSource, backendSource };
}