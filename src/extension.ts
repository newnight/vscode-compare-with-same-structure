// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import {exec} from 'child_process';
import {sep,normalize} from 'path';
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
			var currentPath: string = "";
			if (uri && uri.fsPath) {
                currentPath = uri.fsPath;
            }else if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document) {
                currentPath = vscode.window.activeTextEditor.document.fileName;
			}
			// pick workspace folders
			if (""===currentPath && vscode.workspace.workspaceFolders) {
				vscode.window.showWorkspaceFolderPick({placeHolder:"please choose a folder as 'Source Uri'"}).then(selection => { 
					// the user canceled the selection 
					if (!selection) { 
						return; 
					} 
					currentPath = selection.uri.path;
				}); 
			} 
			if (""===currentPath) {
				vscode.window.showErrorMessage('There is no source Uri to compare');
				return;
			}
			
			currentPath=normalize(currentPath)+sep;
			currentPath=upperPath(currentPath);
			let items: vscode.QuickPickItem[] = []; 

			diffLists.forEach((diffList: DiffList) => { 
				diffList.path = upperPath(normalize(diffList.path+sep));
				if (currentPath.includes(diffList.path)) {
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
				let targetUri: string = currentPath.replace(sourceUri, selection.description || '');
				if (targetUri===currentPath) {
					vscode.window.showErrorMessage('There is no directory that needs to be compared: source and target are consistent.');
					return;
				}
				let cmd = `${diffToolPath} "${currentPath}" "${targetUri}"`;
				console.log(cmd);
				exec(cmd,(exception, stdout, stderr) => {
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
function upperPath(pathStr=''){
	let arr = pathStr.split(':');
	if (arr[0] && pathStr.indexOf(':')>0){
		arr[0] = arr[0].toUpperCase();
	}
	return arr.join(':');
}
// This method is called when your extension is deactivated
export function deactivate() {}
