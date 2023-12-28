import { app, dialog, ipcMain } from "electron";

import { mainWindow } from "./index";
import { performFinalSave } from "./utils";
import FileFilter = Electron.FileFilter;
import { Simulate } from "react-dom/test-utils";
import submit = Simulate.submit;

ipcMain.on("file-dialog-open", (event, filters: FileFilter[], defaultPath: string) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: filters,
      defaultPath: defaultPath,
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        event.sender.send("file-dialog-close", result.filePaths[0]);
      }
    });
});

ipcMain.on("directory-dialog-open", (event, defaultPath: string) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      defaultPath: defaultPath,
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        event.sender.send("directory-dialog-close", result.filePaths[0]);
      }
    });
});

ipcMain.handle(
  "handle-final-submit",
  async (event, submitData: SubmitData) => await performFinalSave(submitData),
);

ipcMain.on("get-downloads-directory", (event, onDone: (downloadsDirectory: string) => void) => {
  event.sender.send("downloads-directory-get", app.getPath("downloads"));
});
