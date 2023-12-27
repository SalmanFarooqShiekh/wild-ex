import { app, dialog, ipcMain } from "electron";

import { mainWindow } from "./index";
import { saveXyz } from "./utils";
import FileFilter = Electron.FileFilter;

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

ipcMain.on("handle-final-submit", async (event, submitData: SubmitData) => {
  event.sender.send("final-submit-handle", await saveXyz(submitData));
});

ipcMain.on("get-downloads-directory", (event, onDone: (downloadsDirectory: string) => void) => {
  event.sender.send("downloads-directory-get", app.getPath("downloads"));
});
