import * as fs from "fs";
import * as path from "path";

const TEMPLATE_DIR = "templates";

export async function loadTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(
    __dirname,
    "..",
    TEMPLATE_DIR,
    `${templateName.toLowerCase()}.cs.template`
  );
  console.log(`Loading template from: ${templatePath}`);

  try {
    return await fs.promises.readFile(templatePath, "utf8");
  } catch (error: any) {
    throw new Error(`Failed to load template: ${error.message}`);
  }
}

export function processTemplate(
  template: string,
  namespace: string,
  typeName: string
): string {
  return template
    .replace(/{{namespace}}/g, namespace)
    .replace(/{{typeName}}/g, typeName)
    .replace(/{{cursor}}/g, "");
}
