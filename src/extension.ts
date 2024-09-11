// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import {exec} from 'child_process';
import {sep,normalize,basename} from 'path';
interface DiffList{
	name: string,
	path: string,
	updateBeforeDiff?: boolean,
	updateCommand?: string
}
var usVscode=false;
const { diffToolPath, diffLists } = vscode.workspace.getConfiguration('newnight');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	if (!fs.existsSync(diffToolPath)) {
		// vscode.window.showErrorMessage('Difftool is not available, please check if the path is correct,will try to using vscode built-in comparison');
		usVscode=true;
	}
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
		if(usVscode){
			currentPath=normalize(currentPath);
		}else{
			currentPath=normalize(currentPath)+sep;
		}
		
		currentPath=upperPath(currentPath);
		let items: vscode.QuickPickItem[] = []; 

		diffLists.forEach((diffList: DiffList) => { 
			diffList.path = upperPath(normalize( usVscode?diffList.path:diffList.path+sep));
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
			const currentSetting = diffLists.filter((i: DiffList) => {
				return i.name == selection?.label; 
			});
			const { updateBeforeDiff, updateCommand } = currentSetting[0];
			// the user canceled the selection 
			if (!selection) { 
				return; 
			} 
			currentPath = currentPath.replace(/\/$/, '');
			let targetUri: string = currentPath.replace(sourceUri, selection.description || '').replace(/\/$/, '');
			if (targetUri===currentPath) {
				vscode.window.showErrorMessage('There is no directory that needs to be compared: source and target are consistent.');
				return;
			}
			// update before compare
			if ( usVscode ) {
				const leftUri = vscode.Uri.file ( currentPath ),
				rightUri = vscode.Uri.file ( targetUri ),
				leftName = basename ( currentPath ),
				title = `Diff ${leftName} `;
				if (updateBeforeDiff && updateCommand) {
					let _tmpCmd = `${updateCommand}  "${rightUri}"`;
					console.log(`update command -> ${_tmpCmd}`);
					await exec(`${updateCommand}  "${rightUri}"`, (exception, stdout, stderr) => {
						if (exception) {
							console.warn(`update exception -> ${exception}`);
						}
						if (stdout) {
							console.log(`update stdout -> ${stdout}`);
						}
						if (stderr) {
							console.error(`update stderr -> ${stderr}`);
						}
						return vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, title);
					});
				}else{
					return vscode.commands.executeCommand ( 'vscode.diff', leftUri, rightUri, title );
				}	
			}else{
				let execCmd = `${diffToolPath} "${currentPath}" "${targetUri}"`;
				if (updateBeforeDiff && updateCommand) {
					execCmd = `${updateCommand}"${targetUri}" && ${execCmd} `;
				}
				console.log(execCmd);
				exec(execCmd,(exception, stdout, stderr) => {
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
			}
		}); 
	}));
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
