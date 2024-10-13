import * as fs from "fs";
import * as path from "path";

const TEMPLATE_DIR = "templates";

export function loadTemplate(templateName: string): string {
  const templatePath = path.join(
    __dirname,
    "..",
    TEMPLATE_DIR,
    `${templateName.toLowerCase()}.cs.template`
  );
  return fs.readFileSync(templatePath, "utf8");
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
