import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { loadTemplate, processTemplate } from "./templateHandler";

export async function createFileType(
  options: { type?: string; prefix?: string },
  uri: vscode.Uri
) {
  const folderPath = uri.fsPath;
  const type = options.type || "Class";
  const prefix = options.prefix || "";

  const fileName = await promptForFileName(type);

  if (!fileName) {
    vscode.window.showErrorMessage("File name is required");
    return;
  }

  const fullFileName = `${prefix}${fileName}`;
  console.log(`Creating file: ${fullFileName}`);

  const filePath = path.join(folderPath, `${fullFileName}.cs`);

  const namespace = deriveNamespace(folderPath);
  vscode.window.showInformationMessage(
    `Creating file in namespace: ${namespace}`
  );

  try {
    const template = await loadTemplate(type);
    const fileContent = processTemplate(template, namespace, fullFileName);

    await createFile(filePath, fileContent, type, fullFileName);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error creating file: ${error.message}`);
  }
}

function promptForFileName(type: string): Thenable<string | undefined> {
  const defaultName = `New${type}`;
  return vscode.window.showInputBox({
    prompt: `Enter the name of the new ${type}`,
    value: defaultName,
    validateInput: (value) => {
      if (!value) {
        return `${type} name cannot be empty`;
      }
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
        return `${type} name should start with a capital letter and contain only alphanumeric characters`;
      }
      return null;
    },
  });
}

function deriveNamespace(folderPath: string): string {
  const projectRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || "";
  const relativePath = path.relative(projectRoot, folderPath);
  const namespaceParts = relativePath.split(path.sep).filter(Boolean);
  return namespaceParts.join(".");
}

async function createFile(
  filePath: string,
  fileContent: string,
  type: string,
  fileName: string
): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, fileContent);
    vscode.window.showInformationMessage(`Created new ${type}: ${fileName}`);
    console.log(`File created at: ${filePath}`);
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);
  } catch (err: any) {
    throw new Error(`Failed to create ${type}: ${err.message}`);
  }
}
