import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface ModuleTreeNode {
	path?: string;
	components?: string[];
	children?: { [key: string]: ModuleTreeNode };
}

interface ModuleTree {
	[key: string]: ModuleTreeNode;
}

export class WikiTreeItem extends vscode.TreeItem {
	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly resourcePath: string,
		public readonly isDirectory: boolean,
		public readonly isOverview: boolean = false,
		public readonly moduleKey?: string
	) {
		// Remove .md suffix from display name, format module names nicely
		let displayLabel = label.endsWith('.md') ? label.slice(0, -3) : label;
		
		// For overview, show a home icon
		if (isOverview) {
			displayLabel = '📚 ' + displayLabel;
		} else {
			// Convert snake_case to Title Case for better readability
			displayLabel = displayLabel.split('_').map(word => 
				word.charAt(0).toUpperCase() + word.slice(1)
			).join(' ');
		}
		
		super(displayLabel, collapsibleState);
		this.tooltip = this.resourcePath;
		this.contextValue = isOverview ? 'overview' : (isDirectory ? 'folder' : 'file');

		if (!isDirectory || isOverview) {
			this.command = {
				command: 'codewiki.openFile',
				title: 'Open Wiki File',
				arguments: [this.resourcePath]
			};
			this.iconPath = isOverview 
				? new vscode.ThemeIcon('home')
				: new vscode.ThemeIcon('file');
		} else {
			this.iconPath = new vscode.ThemeIcon('folder');
		}
	}
}

export class CodeWikiTreeProvider implements vscode.TreeDataProvider<WikiTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<WikiTreeItem | undefined | null | void> = new vscode.EventEmitter<WikiTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<WikiTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private workspaceRoot: string | undefined;
	private wikiPath: string | undefined;
	private hasWiki: boolean = false;
	private moduleTree: ModuleTree | undefined;

	constructor() {
		console.log('[CodeWiki] TreeProvider constructor called');
		this.updateWorkspaceRoot();
	}

	public getHasWiki(): boolean {
		return this.hasWiki;
	}

	private loadModuleTree(): ModuleTree | undefined {
		if (!this.wikiPath) {
			return undefined;
		}

		const moduleTreePath = path.join(this.wikiPath, 'module_tree.json');
		if (!fs.existsSync(moduleTreePath)) {
			console.log('[CodeWiki] module_tree.json not found');
			return undefined;
		}

		try {
			const content = fs.readFileSync(moduleTreePath, 'utf-8');
			const tree = JSON.parse(content) as ModuleTree;
			console.log('[CodeWiki] Loaded module_tree.json with', Object.keys(tree).length, 'modules');
			return tree;
		} catch (error) {
			console.error('[CodeWiki] Error loading module_tree.json:', error);
			return undefined;
		}
	}

	private updateWorkspaceRoot() {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		console.log('[CodeWiki] updateWorkspaceRoot - workspace folders:', workspaceFolders?.length || 0);
		if (workspaceFolders && workspaceFolders.length > 0) {
			this.workspaceRoot = workspaceFolders[0].uri.fsPath;
			this.wikiPath = path.join(this.workspaceRoot, '.codewiki');
			this.hasWiki = fs.existsSync(this.wikiPath);
			console.log('[CodeWiki] workspaceRoot set to:', this.workspaceRoot);
			console.log('[CodeWiki] wikiPath set to:', this.wikiPath);
			console.log('[CodeWiki] hasWiki:', this.hasWiki);
			
			// Load module tree if wiki exists
			if (this.hasWiki) {
				this.moduleTree = this.loadModuleTree();
			} else {
				this.moduleTree = undefined;
			}
			
			// Update context for views
			vscode.commands.executeCommand('setContext', 'codewiki.hasWiki', this.hasWiki);
		} else {
			this.workspaceRoot = undefined;
			this.wikiPath = undefined;
			this.hasWiki = false;
			this.moduleTree = undefined;
			console.log('[CodeWiki] No workspace folders found');
			vscode.commands.executeCommand('setContext', 'codewiki.hasWiki', false);
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
			return [];
		}

		// Root level: show overview.md at top, then modules from module_tree
		if (!element) {
			const items: WikiTreeItem[] = [];
			
			// Add overview.md as the first item (home page)
			const overviewPath = path.join(this.wikiPath, 'overview.md');
			if (fs.existsSync(overviewPath)) {
				items.push(new WikiTreeItem(
					'Overview',
					vscode.TreeItemCollapsibleState.None,
					overviewPath,
					false,
					true // isOverview
				));
			}
			
			// If we have module_tree.json, use it to build the hierarchy
			if (this.moduleTree) {
				const moduleItems = this.buildModuleTreeItems(this.moduleTree);
				items.push(...moduleItems);
			} else {
				// Fallback to file system scanning if no module_tree.json
				const fsItems = await this.scanFileSystem(this.wikiPath);
				items.push(...fsItems);
			}
			
			return items;
		}

		// For module nodes, show their children
		if (element.moduleKey && this.moduleTree) {
			const childItems = this.getModuleChildren(element.moduleKey);
			return childItems;
		}

		// Fallback: shouldn't reach here if using module tree
		return [];
	}

	private buildModuleTreeItems(tree: ModuleTree, parentKey?: string): WikiTreeItem[] {
		const items: WikiTreeItem[] = [];
		
		for (const [key, node] of Object.entries(tree)) {
			const fullKey = parentKey ? `${parentKey}.${key}` : key;
			const mdPath = path.join(this.wikiPath!, `${key}.md`);
			
			// Check if this module has children
			const hasChildren = !!(node.children && Object.keys(node.children).length > 0);
			const collapsibleState = hasChildren 
				? vscode.TreeItemCollapsibleState.Collapsed 
				: vscode.TreeItemCollapsibleState.None;
			
			items.push(new WikiTreeItem(
				key,
				collapsibleState,
				mdPath,
				hasChildren,
				false,
				fullKey
			));
		}
		
		// Sort alphabetically
		items.sort((a, b) => {
			const labelA = typeof a.label === 'string' ? a.label : (a.label?.label ?? '');
			const labelB = typeof b.label === 'string' ? b.label : (b.label?.label ?? '');
			return labelA.localeCompare(labelB);
		});
		
		return items;
	}

	private getModuleChildren(moduleKey: string): WikiTreeItem[] {
		if (!this.moduleTree) {
			return [];
		}

		// Navigate to the module in the tree
		const parts = moduleKey.split('.');
		let currentNode: ModuleTreeNode | undefined;
		let currentTree: ModuleTree | { [key: string]: ModuleTreeNode } = this.moduleTree;

		for (const part of parts) {
			currentNode = currentTree[part];
			if (!currentNode) {
				return [];
			}
			currentTree = currentNode.children || {};
		}

		// Build items for children
		if (currentNode?.children) {
			return this.buildModuleTreeItems(currentNode.children, moduleKey);
		}

		return [];
	}

	private async scanFileSystem(targetPath: string): Promise<WikiTreeItem[]> {
		try {
			const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
			console.log('[CodeWiki] Found', items.length, 'items');
			const treeItems: WikiTreeItem[] = [];

			for (const item of items) {
				const fullPath = path.join(targetPath, item.name);
				const isDirectory = item.isDirectory();

				// Skip overview.md (already shown at top) and non-markdown files
				if (item.name === 'overview.md' || item.name === 'module_tree.json' || item.name === 'metadata.json' || item.name === 'first_module_tree.json') {
					continue;
				}

				// Only show markdown files and directories
				if (!isDirectory && !item.name.endsWith('.md')) {
					console.log('[CodeWiki] Skipping non-markdown file:', item.name);
					continue;
				}

				// Skip temp directory
				if (isDirectory && item.name === 'temp') {
					continue;
				}

				const collapsibleState = isDirectory
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.None;

				treeItems.push(new WikiTreeItem(
					item.name,
					collapsibleState,
					fullPath,
					isDirectory,
					false
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
