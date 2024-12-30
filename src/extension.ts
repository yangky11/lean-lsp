// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import OpenAI from 'openai';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "lean-lsp" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('lean-lsp.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const document = activeEditor.document;
			const selection = activeEditor.selection;
			const selectedText = document.getText(selection);
			if (selectedText === "sorry") {
				vscode.window.showInputBox({
					prompt: "Enter your OpenAI API key",
					placeHolder: "OpenAI API key",
				}).then((apiKey) => {
					const client = new OpenAI({
						apiKey: apiKey,
					});
					const fileContent = `\`\`\`lean\n${document.getText(new vscode.Range(0, 0, selection.start.line, selection.start.character))}\n\`\`\``;
					const lean4Extension = vscode.extensions.getExtension('leanprover.lean4');
					// Assert that the Lean 4 extension is installed
					if (!lean4Extension) {
						vscode.window.showErrorMessage('Lean 4 extension is not installed');
						return;
					}
					lean4Extension.exports.lean4EnabledFeatures.then((features: any) => {
						const editorApi = features.infoProvider.editorApi;
						editorApi.sendClientRequest(document.uri.toString(), '$/lean/plainGoal', {textDocument: {uri: document.uri.toString()}, position: {line: selection.start.line, character: selection.start.character}}).then((response: any) => {
							const goals = response.rendered.trim();
							const systemPrompt = "You are an expert in Lean 4 theorem proving. Given a Lean 4 file content up to the current cursor position and the remaining proof goals, suggest a single tactic that would help progress the proof. Your response must have exactly one line, and it should include only the tactic, WITHOUT any additional explanation or formatting.";
							const userPrompt = `File content up to the current position:\n\n${fileContent}\n\nRemaining proof goals:\n\n${goals}`;
							vscode.window.showInformationMessage(`System: ${systemPrompt}`);
							vscode.window.showInformationMessage(`User: ${userPrompt}`);
							client.chat.completions.create({
								model: "gpt-4o",
								messages: [
									{ role: "system", content: systemPrompt },
									{ role: "user", content: fileContent }
								],
							}).then((response) => {
								const content = response.choices[0].message.content;
								vscode.window.showInformationMessage(`Assistant: ${content}`);
								if (content) {
									// Replace the selected text with the response
									activeEditor.edit((editBuilder) => {
										editBuilder.replace(selection, content);
									});
								}
							});
						});
					});
				});
			} else {
				vscode.window.showInformationMessage('No `sorry` selected');
			}
			
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
