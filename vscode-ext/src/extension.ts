import * as vscode from 'vscode';
import { CodeWikiTreeProvider } from './wikiTreeProvider';
import { WikiViewerProvider } from './wikiViewerProvider';
import { DebugOutputService, IDebugOutputService } from './debugOutputService';
import { MermaidErrorFixer } from './mermaidErrorFixer';

export function activate(context: vscode.ExtensionContext) {
	console.log('[CodeWiki] Extension activating');
	console.log('[CodeWiki] Current workspace folders:', vscode.workspace.workspaceFolders?.length || 0);
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		console.log('[CodeWiki] Workspace folder paths:', vscode.workspace.workspaceFolders.map(f => f.uri.fsPath).join(', '));
	}

	// Create debug output service
	const debugOutputService: IDebugOutputService = new DebugOutputService();
	console.log('[CodeWiki] Debug output service created');

	// Create Mermaid error fixer
	const mermaidErrorFixer = new MermaidErrorFixer(debugOutputService);
	console.log('[CodeWiki] Mermaid error fixer created');

	// Create tree provider
	const treeProvider = new CodeWikiTreeProvider();

	// Create viewer provider with debug service
	const viewerProvider = new WikiViewerProvider(context.extensionUri, debugOutputService);
	context.subscriptions.push(viewerProvider);

	// Register tree view
	const treeView = vscode.window.createTreeView('codewiki', {
		treeDataProvider: treeProvider,
		showCollapseAll: true
	});

	console.log('[CodeWiki] Tree view created successfully');
	context.subscriptions.push(treeView);

	// Trigger initial refresh to populate the view
	setTimeout(() => {
		console.log('[CodeWiki] Triggering initial refresh');
		treeProvider.refresh();
	}, 100);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.refresh', () => {
			console.log('[CodeWiki] Refresh command triggered');
			treeProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.openFile', (filePath: string) => {
			console.log('[CodeWiki] Opening file:', filePath);
			viewerProvider.openWikiFile(filePath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.openInEditor', async (filePath: string) => {
			console.log('[CodeWiki] Opening file in editor:', filePath);
			const doc = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(doc);
		})
	);

	// Register command to show debug output
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.showDebugOutput', () => {
			console.log('[CodeWiki] Show debug output command triggered');
			const output = debugOutputService.consoleOutput;
			
			if (output.length === 0) {
				vscode.window.showInformationMessage('No debug output captured yet.');
				return;
			}

			// Create a new document with the output
			const outputText = output.join('\n');
			vscode.workspace.openTextDocument({
				content: outputText,
				language: 'log'
			}).then(doc => {
				vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
			});
		})
	);

	// Register command to show only Mermaid errors
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.showMermaidErrors', () => {
			console.log('[CodeWiki] Show Mermaid errors command triggered');
			const errors = debugOutputService.getMermaidErrors();
			
			if (errors.length === 0) {
				vscode.window.showInformationMessage('No Mermaid errors captured.');
				return;
			}

			// Parse and format Mermaid errors for better readability
			const formattedErrors = errors.map((error, index) => {
				try {
					const match = error.match(/\[.*?\] \[ERROR\] \[mermaid\] (.*)/);
					if (match) {
						const errorData = JSON.parse(match[1]);
						return `
=== Mermaid Error ${index + 1} ===
Diagram Index: ${errorData.diagramIndex}
Error: ${errorData.error}
Stack: ${errorData.stack || 'N/A'}

Diagram Code:
${errorData.code}

==========================================
`;
					}
				} catch (e) {
					// If parsing fails, return the raw error
					return error;
				}
				return error;
			}).join('\n');

			vscode.workspace.openTextDocument({
				content: formattedErrors,
				language: 'log'
			}).then(doc => {
				vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
			});
		})
	);

	// Register command to clear debug output
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.clearDebugOutput', () => {
			console.log('[CodeWiki] Clear debug output command triggered');
			debugOutputService.clearOutput();
			vscode.window.showInformationMessage('Debug output cleared.');
		})
	);

	// Register command to fix Mermaid rendering errors with Copilot
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.fixMermaidErrors', async () => {
			console.log('[CodeWiki] Analyze Mermaid rendering errors command triggered');
			await mermaidErrorFixer.sendErrorsToCopilot();
		})
	);

	// Register command to show error report in chat
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.showErrorReport', () => {
			console.log('[CodeWiki] Show error report command triggered');
			const report = mermaidErrorFixer.createErrorReport();
			
			// Copy to clipboard for easy sharing
			vscode.env.clipboard.writeText(report);
			
			// Show in new document
			vscode.workspace.openTextDocument({
				content: report,
				language: 'markdown'
			}).then(doc => {
				vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
			});
			
			vscode.window.showInformationMessage('Error report copied to clipboard');
		})
	);

	// Register command to copy prompt for cross-workspace usage
	context.subscriptions.push(
		vscode.commands.registerCommand('codewiki.copyPromptToClipboard', () => {
			console.log('[CodeWiki] Copy prompt to clipboard command triggered');
			const prompt = mermaidErrorFixer.getCopilotPromptText();
			
			vscode.env.clipboard.writeText(prompt);
			
			vscode.window.showInformationMessage(
				'Copilot prompt copied to clipboard! You can paste it in any VS Code window.',
				'Open in This Window',
				'Done'
			).then(selection => {
				if (selection === 'Open in This Window') {
					vscode.commands.executeCommand('workbench.panel.chat.view.copilot.focus');
				}
			});
		})
	);

	// Optional: Start auto-monitoring for errors
	const config = vscode.workspace.getConfiguration('codewiki');
	if (config.get('autoDetectMermaidErrors', false)) {
		console.log('[CodeWiki] Starting auto-monitoring for Mermaid errors');
		const monitor = mermaidErrorFixer.startAutoMonitoring(5000);
		context.subscriptions.push(monitor);
	}

	// Update tree when workspace folders change
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders((e) => {
			console.log('[CodeWiki] Workspace folders changed event received');
			console.log('[CodeWiki] Added:', e.added.length, 'Removed:', e.removed.length);
			// Use a small delay to ensure VS Code has updated workspaceFolderCount context
			setTimeout(() => {
				console.log('[CodeWiki] Refreshing tree after workspace change');
				treeProvider.refresh();
			}, 100);
		})
	);

	console.log('[CodeWiki] Extension activated successfully');
}

export function deactivate() {
	console.log('[CodeWiki] Extension deactivating');
}
