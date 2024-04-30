/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { 
	workspace, 
	ExtensionContext, 
	window,
	DecorationOptions,
	Diagnostic,
	TextEditorDecorationType
} from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

const decorationType: TextEditorDecorationType = window.createTextEditorDecorationType({
	after: {
		contentText: '🤏'
	}
});

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server file types
		documentSelector: [
			{ scheme: 'file', language: 'typescript' }
		],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	client.onNotification("decorateSymbols", (diagnostics: Diagnostic[]) => {
		decorateSymbols(diagnostics);
	});

	// Start the client. This will also launch the server
	client.start();
}

export function decorateSymbols(diagnostics: Diagnostic[]): void {
	const editor = window.activeTextEditor;
	
	// return if no active editor
	if (!editor) {
		return;
	}
	
	// remove existing decorations
	const decorations: DecorationOptions[] = [];
	editor.setDecorations(decorationType, decorations);
	
	// create decoration for each diagnostic from language server
	diagnostics.forEach(diag => {
		decorations.push({
			range: diag.range
		});
	});

	// display decorationen with defined decoration type
	editor.setDecorations(decorationType, decorations);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}