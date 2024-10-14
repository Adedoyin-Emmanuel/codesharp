import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import * as findUpGlob from "find-up-glob";
import { loadTemplate, processTemplate } from "./templateHandler";

export async function createFileType(
  options: { type?: string; prefix?: string },
  uri: vscode.Uri
) {
  const folderPath = uri.fsPath;
  const type = options.type || "Class";
  const prefix = options.prefix || "";

  const fileName = await promptForFileName(type, prefix);

  if (!fileName) {
    vscode.window.showErrorMessage("File name is required");
    return;
  }

  const fullFileName = `${fileName}.cs`;
  console.log(`Creating file: ${fullFileName}`);

  const filePath = path.join(folderPath, fullFileName);

  try {
    const projectFilePath = await findProjectFile(folderPath);
    const namespace = await deriveNamespace(projectFilePath, folderPath);
    vscode.window.showInformationMessage(
      `Creating file in namespace: ${namespace}`
    );

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
  if (!value) return "File name cannot be empty";
  if (prefix && !value.startsWith(prefix))
    return `File name must start with "${prefix}"`;
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(value.slice(prefix.length))) {
    return `${value.slice(
      prefix.length
    )} should start with a capital letter and contain only alphanumeric characters`;
  }
  return null;
}

async function findProjectFile(directory: string): Promise<string> {
  const projectFile = findUpGlob.sync("*.csproj", { cwd: directory });
  if (!projectFile) throw new Error("Unable to find *.csproj file");
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
  console.log(`File created at: ${filePath}`);
  await vscode.workspace.openTextDocument(filePath).then((content) => {
    vscode.window.showTextDocument(content).then((editor) => {
      editor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    });
  });
}
