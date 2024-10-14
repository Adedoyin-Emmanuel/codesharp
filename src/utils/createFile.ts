import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { lstatSync, existsSync } from "fs";
import * as findUpGlob from "find-up-glob";
import { loadTemplate, processTemplate } from "./templateHandler";

export async function createFileType(
  options: { type?: string; prefix?: string },
  uri: vscode.Uri
) {
  const type = options.type || "Class";
  const prefix = options.prefix || "";

  const fileName = await promptForFileName(type, prefix);

  if (!fileName) {
    vscode.window.showErrorMessage("File name is required");
    return;
  }

  const fullFileName = `${fileName}.cs`;
  console.log(`Creating file: ${fullFileName}`);

  /**
   *
   * We try to get the current working directory of the user.
   * based on 3 conditions.
   *
   * 1. Where the user right clicks to create the file
   * 2. The currently opened file tabs.
   * 3. The last opened workspace folder if the user has multiple
   * workspace folders or first is there is only one opened workspace folder.
   */
  let workingDirectory =
    (uri && uri.fsPath) ||
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.document.fileName) ||
    (vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders[
        vscode.workspace.workspaceFolders.length - 1
      ].uri.fsPath) ||
    vscode.workspace.rootPath; // fall back to project root directory

  console.log("Current opened dir");
  console.log(vscode.workspace.workspaceFolders?.length);
  /**
   *
   * Checks if the working directory is a directory and adjusts accordingly
   * Happens when user right clicks on a file instead of the directory.
   *
   * We then get the immediate directory where the file is located
   */
  if (!lstatSync(workingDirectory as any).isDirectory()) {
    console.log("Working directory is not a directory");
    console.log(workingDirectory);
    workingDirectory = path.dirname(workingDirectory as any);
    console.log("Working directory is now a directory");
    console.log(workingDirectory);
  }

  if (!workingDirectory) {
    vscode.window.showErrorMessage(
      "No active workspace or editor to determine working directory."
    );
    return;
  }

  const filePath = path.join(workingDirectory, fullFileName);

  if (existsSync(filePath)) {
    vscode.window.showErrorMessage(
      "File already exists. Please choose a different name."
    );
    return;
  }

  try {
    const projectFilePath = await findProjectFile(workingDirectory);
    const namespace = await deriveNamespace(projectFilePath, workingDirectory);
    const template = await loadTemplate(type.toLowerCase());
    const fileContentObj = processTemplate(template, namespace, fileName);
    const fileContent = fileContentObj.content;
    const cursorPosition = fileContentObj.cursorPosition;

    await createFile(filePath, fileContent, type, fileName, cursorPosition);
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error creating file: ${error.message}`);
  }
}

async function promptForFileName(
  type: string,
  prefix: string
): Promise<string | undefined> {
  const defaultName = `${prefix}New${type}`;
  const fileName = await vscode.window.showInputBox({
    prompt: `Enter the name of the new ${type}`,
    value: defaultName,
    validateInput: (value) => validateFileName(value, prefix),
  });

  return fileName
    ? fileName.startsWith(prefix)
      ? fileName
      : `${prefix}${fileName}`
    : undefined;
}

function validateFileName(value: string, prefix: string): string | null {
  if (!value) {
    return "File name cannot be empty";
  }
  if (prefix && !value.startsWith(prefix)) {
    return `File name must start with "${prefix}"`;
  }
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(value.slice(prefix.length))) {
    return `${value.slice(
      prefix.length
    )} should start with a capital letter and contain only alphanumeric characters`;
  }
  return null;
}

async function findProjectFile(directory: string): Promise<string> {
  console.log(directory);
  const projectFile = findUpGlob.sync("*.csproj", { cwd: directory });
  if (!projectFile) {
    throw new Error("Unable to find .csproj file");
  }
  return projectFile[0];
}

async function deriveNamespace(
  projectFilePath: string,
  folderPath: string
): Promise<string> {
  const rootNamespace = await getRootNamespace(projectFilePath);
  const projectDir = path.dirname(projectFilePath);
  const relativePath = path.relative(projectDir, folderPath);
  const namespaceSuffix = relativePath.split(path.sep).join(".");
  return namespaceSuffix
    ? `${rootNamespace}.${namespaceSuffix}`
    : rootNamespace;
}

async function getRootNamespace(projectFilePath: string): Promise<string> {
  const content = await fs.readFile(projectFilePath, "utf8");
  const match = /<RootNamespace>(.*?)<\/RootNamespace>/.exec(content);
  return match ? match[1] : path.basename(projectFilePath, ".csproj");
}

async function createFile(
  filePath: string,
  fileContent: string,
  type: string,
  fileName: string,
  cursorPosition: vscode.Position
): Promise<void> {
  await fs.writeFile(filePath, fileContent);
  vscode.window.showInformationMessage(`Created new ${type}: ${fileName}`);
  await vscode.workspace.openTextDocument(filePath).then((content) => {
    vscode.window.showTextDocument(content).then((editor) => {
      editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    });
  });
}
