import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class WikiTreeItem extends vscode.TreeItem {
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly resourcePath: string,
		public readonly isDirectory: boolean,
		public readonly hasMdFile: boolean = false
	) {
		// Remove .md suffix from display name
		const displayLabel = label.endsWith('.md') ? label.slice(0, -3) : label;
		super(displayLabel, collapsibleState);
		this.tooltip = this.resourcePath;
		this.contextValue = isDirectory ? 'folder' : 'file';

		if (!isDirectory) {
			this.command = {
				command: 'codewiki.openFile',
				title: 'Open Wiki File',
				arguments: [this.resourcePath]
			};
			this.iconPath = new vscode.ThemeIcon('file');
		} else {
			this.iconPath = new vscode.ThemeIcon('folder');
			// If folder has a corresponding .md file, add command to open it
			if (hasMdFile) {
				const folderName = path.basename(resourcePath);
				const mdFilePath = path.join(resourcePath, `${folderName}.md`);
				this.command = {
					command: 'codewiki.openFile',
					title: 'Open Wiki File',
					arguments: [mdFilePath]
				};
			}
		}
	}
}

export class CodeWikiTreeProvider implements vscode.TreeDataProvider<WikiTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<WikiTreeItem | undefined | null | void> = new vscode.EventEmitter<WikiTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<WikiTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private workspaceRoot: string | undefined;
	private wikiPath: string | undefined;

	constructor() {
		console.log('[CodeWiki] TreeProvider constructor called');
		this.updateWorkspaceRoot();
	}

	private updateWorkspaceRoot() {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		console.log('[CodeWiki] updateWorkspaceRoot - workspace folders:', workspaceFolders?.length || 0);
		if (workspaceFolders && workspaceFolders.length > 0) {
			this.workspaceRoot = workspaceFolders[0].uri.fsPath;
			this.wikiPath = path.join(this.workspaceRoot, '.codewiki');
			console.log('[CodeWiki] workspaceRoot set to:', this.workspaceRoot);
			console.log('[CodeWiki] wikiPath set to:', this.wikiPath);
		} else {
			this.workspaceRoot = undefined;
			this.wikiPath = undefined;
			console.log('[CodeWiki] No workspace folders found');
		}
	}

	refresh(): void {
		this.updateWorkspaceRoot();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: WikiTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: WikiTreeItem): Promise<WikiTreeItem[]> {
		console.log('[CodeWiki] getChildren called, element:', element?.label);
		console.log('[CodeWiki] wikiPath:', this.wikiPath);
		console.log('[CodeWiki] workspaceRoot:', this.workspaceRoot);

		if (!this.wikiPath) {
			console.log('[CodeWiki] No wikiPath set - no workspace folder');
			return [];
		}

		if (!fs.existsSync(this.wikiPath)) {
			console.log('[CodeWiki] Path does not exist:', this.wikiPath);
			// Don't show the information message here, let the viewsWelcome handle it
			return [];
		}

		const targetPath = element ? element.resourcePath : this.wikiPath;
		console.log('[CodeWiki] Reading path:', targetPath);

		try {
			const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
			console.log('[CodeWiki] Found', items.length, 'items');
			const treeItems: WikiTreeItem[] = [];

			for (const item of items) {
				const fullPath = path.join(targetPath, item.name);
				const isDirectory = item.isDirectory();

				console.log('[CodeWiki] Item:', item.name, 'isDir:', isDirectory);

				// Only show markdown files and directories
				if (!isDirectory && !item.name.endsWith('.md')) {
					console.log('[CodeWiki] Skipping non-markdown file:', item.name);
					continue;
				}

			// Skip .md files that have a corresponding folder at the same level
			if (!isDirectory && item.name.endsWith('.md')) {
				const baseName = item.name.slice(0, -3);
				const folderPath = path.join(targetPath, baseName);
				if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
					console.log('[CodeWiki] Skipping .md file with folder:', item.name);
					continue;
				}
				
				// Skip .md files inside a folder if they have the same name as the folder
				const parentFolderName = path.basename(targetPath);
				if (baseName === parentFolderName) {
					console.log('[CodeWiki] Skipping self-named .md file inside folder:', item.name);
					continue;
				}
			}				let hasMdFile = false;
				if (isDirectory) {
					// Check if folder has a corresponding .md file
					const mdFilePath = path.join(fullPath, `${item.name}.md`);
					hasMdFile = fs.existsSync(mdFilePath);
					console.log('[CodeWiki] Folder', item.name, 'has .md file:', hasMdFile);
				}

				const collapsibleState = isDirectory
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.None;

				treeItems.push(new WikiTreeItem(
					item.name,
					collapsibleState,
					fullPath,
					isDirectory,
					hasMdFile
				));
			}

			// Sort: directories first, then files, all alphabetically
			treeItems.sort((a, b) => {
				const labelA = typeof a.label === 'string' ? a.label : (a.label?.label ?? '');
				const labelB = typeof b.label === 'string' ? b.label : (b.label?.label ?? '');
				
				// Directories before files
				if (a.isDirectory && !b.isDirectory) {
					return -1;
				}
				if (!a.isDirectory && b.isDirectory) {
					return 1;
				}
				
				// Then alphabetically
				return labelA.localeCompare(labelB);
			});

			console.log('[CodeWiki] Returning', treeItems.length, 'items');
			return treeItems;
		} catch (error) {
			console.error('[CodeWiki] Error reading wiki directory:', error);
			return [];
		}
	}
}
