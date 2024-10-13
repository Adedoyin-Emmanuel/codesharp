import * as vscode from "vscode";
import {
  CREATE_CLASS_COMMAND,
  CREATE_ENUM_COMMAND,
  CREATE_FILE_COMMAND,
  CREATE_INTERFACE_COMMAND,
  CREATE_RECORD_COMMAND,
  CREATE_STRUCT_COMMAND,
} from "./constants";
import { createFileType } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("CodeSharp extension is now active!");

  context.subscriptions.push(
    vscode.commands.registerCommand(
      CREATE_CLASS_COMMAND,
      createFileType.bind(null, { type: "Class" })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CREATE_INTERFACE_COMMAND,
      createFileType.bind(null, { type: "Interface", prefix: "I" })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CREATE_ENUM_COMMAND,
      createFileType.bind(null, { type: "Enum" })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CREATE_RECORD_COMMAND,
      createFileType.bind(null, { type: "Record" })
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      CREATE_STRUCT_COMMAND,
      createFileType.bind(null, { type: "Struct" })
    )
  );
}

export function deactivate() {}
