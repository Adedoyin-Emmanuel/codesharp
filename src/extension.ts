import {
  CREATE_CLASS_COMMAND,
  CREATE_ENUM_COMMAND,
  CREATE_INTERFACE_COMMAND,
  CREATE_RECORD_COMMAND,
  CREATE_STRUCT_COMMAND,
} from "./constants";
import { createFileType } from "./utils";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("CodeSharp is now active!");

  const commands = [
    { command: CREATE_CLASS_COMMAND, options: { type: "class" } },
    {
      command: CREATE_INTERFACE_COMMAND,
      options: { type: "interface", prefix: "I" },
    },
    { command: CREATE_ENUM_COMMAND, options: { type: "enum" } },
    { command: CREATE_RECORD_COMMAND, options: { type: "record" } },
    { command: CREATE_STRUCT_COMMAND, options: { type: "struct" } },
  ];

  commands.forEach(({ command, options }) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, (uri: vscode.Uri) => {
        createFileType(options, uri);
      })
    );
  });
}

export function deactivate() {}
