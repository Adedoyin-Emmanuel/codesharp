import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";

const TEMPLATE_DIR = "templates";
const CURSOR_PLACEHOLDER = "{{cursor}}";

export async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(
    __dirname,
    "..",
    TEMPLATE_DIR,
    `${templateName.toLowerCase()}.cs.template`
  );
  console.log(`Loading template from: ${templatePath}`);

  try {
    return await fs.readFile(templatePath, "utf8");
  } catch (error: any) {
    throw new Error(`Failed to load template: ${error.message}`);
  }
}

export function processTemplate(
  template: string,
  namespace: string,
  typeName: string
): { content: string; cursorPosition: vscode.Position } {
  let processedTemplate = template
    .replace(/{{namespace}}/g, namespace)
    .replace(/{{typeName}}/g, typeName);

  const cursorPosition = getCursorPosition(processedTemplate);
  processedTemplate = processedTemplate.replace(CURSOR_PLACEHOLDER, "");

  console.log("Logging Cursor Position");
  console.log(cursorPosition);

  return { content: processedTemplate, cursorPosition };
}

function getCursorPosition(text: string): vscode.Position {
  const cursorIndex = text.indexOf(CURSOR_PLACEHOLDER);
  if (cursorIndex === -1) {
    return new vscode.Position(0, 0);
  }

  const textBeforeCursor = text.substring(0, cursorIndex);
  const lines = textBeforeCursor.split("\n");
  const line = lines.length - 1;
  const character = lines[lines.length - 1].length;

  return new vscode.Position(line, character);
}
