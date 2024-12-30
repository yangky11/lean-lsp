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
		// 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
		if (activeEditor) {
			const document = activeEditor.document;
			const selection = activeEditor.selection;
			const selectedText = document.getText(selection);
			console.log(selectedText);
			if (selectedText === "sorry") {
				vscode.window.showInformationMessage('Sorry!');
				vscode.window.showInputBox({
					prompt: "Enter your OpenAI API key",
					placeHolder: "OpenAI API key",
				}).then((apiKey) => {
					console.log(apiKey);
					const client = new OpenAI({
						apiKey: apiKey,
					});
					const fileContent = document.getText(new vscode.Range(0, 0, selection.start.line, selection.start.character));
					const lean4Extension = vscode.extensions.getExtension('leanprover.lean4');
					// Assert that the Lean 4 extension is installed
					if (!lean4Extension) {
						vscode.window.showErrorMessage('Lean 4 extension is not installed');
						return;
					}
					const systemPrompt = "You are an expert in Lean 4 theorem proving. Given a Lean 4 file up to a cursor position in a proof, suggest a single tactic that would help progress the proof. Your response should include only the tactic, with no additional explanation or formatting.";
					console.log(systemPrompt);
					console.log(fileContent);
					client.chat.completions.create({
						model: "gpt-4o",
						messages: [
							{ role: "system", content: systemPrompt },
							{ role: "user", content: fileContent }
						],
					}).then((response) => {
						const content = response.choices[0].message.content;
						console.log(content);
						if (content) {
							// Replace the selected text with the response
							activeEditor.edit((editBuilder) => {
								editBuilder.replace(selection, content);
							});
						}
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
