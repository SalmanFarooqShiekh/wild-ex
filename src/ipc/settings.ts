import { app, ipcMain } from "electron";
import settings from "electron-settings";
import { default_on_error } from "../helpers/ipc";

ipcMain.on("get-settings", (event) => {
  event.sender.send("settings-get", settings.getSync("settings"));
});

ipcMain.on("set-settings", (event, wxSettings: WxSettings) => {
  settings.setSync("settings", wxSettings);
});

ipcMain.on("get-downloads-directory", (event, onDone: (downloadsDirectory: string) => void) => {
  event.sender.send("downloads-directory-get", app.getPath('downloads'));
});
