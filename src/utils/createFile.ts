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
    throw new Error("File name is required");
  }

  const fullFileName = `${prefix}${fileName}`;
  const filePath = path.join(folderPath, `${fullFileName}.cs`);

  const namespace = deriveNamespace(folderPath);
  const template = loadTemplate(type);
  const fileContent = processTemplate(template, namespace, fullFileName);

  createFile(filePath, fileContent, type, fullFileName);
}

function promptForFileName(type: string): Thenable<string | undefined> {
  return vscode.window.showInputBox({
    prompt: `Enter the name of the new ${type}`,
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
  const projectName = path.basename(vscode.workspace.rootPath || "");
  const relativePath = path.relative(
    vscode.workspace.rootPath || "",
    folderPath
  );
  const namespaceParts = [projectName, ...relativePath.split(path.sep)];
  return namespaceParts.join(".");
}

function createFile(
  filePath: string,
  fileContent: string,
  type: string,
  fileName: string
) {
  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      vscode.window.showErrorMessage(
        `Failed to create ${type}: ${err.message}`
      );
    } else {
      vscode.window.showInformationMessage(`Created new ${type}: ${fileName}`);
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }
  });
}
