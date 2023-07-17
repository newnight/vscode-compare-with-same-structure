// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as child_process from 'child_process';
interface DiffList{
	name: string,
	path: string
}
const { diffToolPath,diffLists} = vscode.workspace.getConfiguration('newnight');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (!fs.existsSync(diffToolPath)) {
		vscode.window.showErrorMessage('Difftool is not available, please check if the path is correct!');
	} else {
		var sourceUri:string;
		
		context.subscriptions.push(vscode.commands.registerCommand('newnight.diffwith.compare', async (uri) => {
			var path: string = "";
			if (uri && uri.fsPath) {
                path = uri.fsPath;
            }else if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document) {
                path = vscode.window.activeTextEditor.document.fileName;
			}
			// pick workspace folders
			if (""===path && vscode.workspace.workspaceFolders) {
				vscode.window.showWorkspaceFolderPick({placeHolder:"please choose a folder as 'Source Uri'"}).then(selection => { 
					// the user canceled the selection 
					if (!selection) { 
						return; 
					} 
					path = selection.uri.path;
				}); 
			} 
			if (""===path) {
				vscode.window.showErrorMessage('There is no source Uri to compare');
				return;
			}
			let items: vscode.QuickPickItem[] = []; 

			diffLists.forEach((diffList: DiffList) => { 
				diffList.path = diffList.path.charAt(-1) === '/' ? diffList.path : diffList.path + '/';
				diffList.path = diffList.path.replace('//','/');
				console.log(diffList.path);
				if (path.indexOf(diffList.path)>=0) {
					sourceUri = diffList.path;
				} else if (fs.existsSync(diffList.path)) {
					items.push({
						label: diffList.name,
						description: diffList.path
					});
				}
			});
			vscode.window.showQuickPick(items).then(async selection => { 
				// the user canceled the selection 
				if (!selection) { 
					return; 
				} 
				let targetUri: string = path.replace(sourceUri, selection.description || '');
				if (targetUri===path) {
					vscode.window.showErrorMessage('There is no directory that needs to be compared: source and target are consistent.');
					return;
				}
				let cmd = `${diffToolPath} "${path}" "${targetUri}"`;
				console.log(cmd);
				child_process.exec(cmd,(exception, stdout, stderr) => {
					if (exception) {
						console.warn(`diffWith exception -> ${exception}`);
					}
					if (stdout) {
						console.log(`diffWith stdout -> ${stdout}`);
					}
					if (stderr) {
						console.error(`diffWith stderr -> ${stderr}`);
					}
				});
			}); 
		}));
	}
}
// This method is called when your extension is deactivated
export function deactivate() {}
