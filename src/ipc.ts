import { app, dialog, ipcMain } from "electron";
import { mainWindow } from "./index";
import {haltFinalSave, performFinalSave} from "./utils";

ipcMain.handle(
  "file-dialog-open",
  async (e, filters: Electron.FileFilter[], defaultPath: string): Promise<string> => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: filters,
      defaultPath: defaultPath,
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
  },
);

ipcMain.handle("directory-dialog-open", async (e, defaultPath: string): Promise<string> => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    defaultPath: defaultPath,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
});

ipcMain.handle("get-downloads-directory", (e): string => app.getPath("downloads"));

ipcMain.handle("halt-final-submit", (e) => haltFinalSave());

ipcMain.handle("handle-final-submit", async (e, sd: SubmitData) => await performFinalSave(sd));
