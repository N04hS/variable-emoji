/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	DocumentDiagnosticReport
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as tsc from 'typescript';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const MIN_LENGTH: number = 1;		// minimum length of variable at highest depth
const LENGTH_PER_DEPTH: number = 3;	// characters needed per added depth level

let diagnostics : Diagnostic[] = [];

class Symbol {
	public node: tsc.Node;
	public parent : Symbol | null;

	public constructor(node: tsc.Node, parent: Symbol | null) {
		this.node = node;
		this.parent = parent;
	}

	public getDepth(): number {
		if (this.parent === null)
			return 0;

		var parentDepth = this.parent.getDepth();
		var parentKind = this.parent.node.kind;

		if (parentKind === tsc.SyntaxKind.FunctionDeclaration
			|| parentKind === tsc.SyntaxKind.ClassDeclaration
			|| parentKind === tsc.SyntaxKind.MethodDeclaration
			|| parentKind === tsc.SyntaxKind.VariableDeclaration
			|| parentKind === tsc.SyntaxKind.PropertyDeclaration) 
		{
			return parentDepth + 1;
		}
		else {
			return parentDepth;
		}
	}
}

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},

			textDocumentSync: TextDocumentSyncKind.Full
		}
	};

	return result;
});

connection.languages.diagnostics.on(async (params) => {
	// VSCode pulls for diagnostics
	// on pull request, send none back
	// push diagnostics on documentChange
	return {
		kind: DocumentDiagnosticReportKind.Full,
		items: []
	} satisfies DocumentDiagnosticReport;
});

async function parseTextDocument(textDocument: TextDocument): Promise<void> {
	let variables: Symbol[] = [];
	diagnostics = [];
	
	// get AST from document
	const sourceFile = tsc.createSourceFile(textDocument.uri, textDocument.getText(), 
							tsc.ScriptTarget.Latest, true);
	// traverse tree and save variable identifiers in list
	visitNode(new Symbol(sourceFile, null), variables);
	
	// get max depth of of tree
	let maxDepth = 0;
	for (const v of variables) {
		const depth = v.getDepth();
		if (depth > maxDepth) {
			maxDepth = depth;
		}
	}

	for (const v of variables) {
		if (v.parent?.node.kind === tsc.SyntaxKind.VariableDeclaration) {
			let varname: string = v.node.getText();
			let varnameLength: number = varname.length;
			let scopeDepth: number = v.getDepth() - 1;

			/* 
			 * on max depth, length should be atleast MIN_LENGTH (1)
			 * per level higher, add LENGHT_PER_DEPTH (3) characters
			*/
			let depthDiff: number = maxDepth - scopeDepth;
			let minLength: number = MIN_LENGTH + (depthDiff * LENGTH_PER_DEPTH);

			if (varnameLength < minLength) {
				diagnostics.push({
					severity: DiagnosticSeverity.Information,
					range: {
						start: textDocument.positionAt(v.node.getStart()),
						end: textDocument.positionAt(v.node.getEnd())
					},
					message: `recommended name length: ${minLength}`,
					source: 'Language Server'
				});
			}
		}
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });

	// send notification to decorate diagnostics
	connection.sendNotification("decorateSymbols", diagnostics);
}

function visitNode(symbol: Symbol, nodes: Symbol[]): void {
	if (symbol.node.kind === tsc.SyntaxKind.VariableDeclaration)
	{
		for (var child of symbol.node.getChildren()) {
			if (child.kind === tsc.SyntaxKind.Identifier) {
				nodes.push(new Symbol(child, symbol));
			}
		}
	}

	tsc.forEachChild(symbol.node, (childNode) => {
		visitNode(new Symbol(childNode, symbol), nodes);
	});
}

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	// only handle typescript files
	if (change.document.languageId !== 'typescript') {
		return;
	}

	parseTextDocument(change.document);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
