import { dialog, ipcMain } from "electron";
import { default_on_error } from "../helpers/ipc";

import { mainWindow } from "../index";
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
    })
    .catch(default_on_error);
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
    })
    .catch(default_on_error);
});
