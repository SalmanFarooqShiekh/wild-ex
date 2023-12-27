import { app, BrowserWindow, nativeImage } from "electron";
import settings from "electron-settings";
import { noop } from "lodash";

import { setDefaultSettings } from "./helpers/first-startup";
import icon from "./assets/icon.png";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

settings.configure({
  atomicSave: true,
  fileName: "settings.json",
  numSpaces: 2,
  prettify: true,
});

let mainWindow: BrowserWindow = undefined;

if (require("electron-squirrel-startup")) {
  app.quit();
}

const getWindow = () => {
  if (mainWindow) {
    return mainWindow;
  }

  const window = new BrowserWindow({
    width: 900,
    minWidth: 900,
    maxWidth: 900,
    height: 900,
    minHeight: 900,
    maxHeight: 900,
    autoHideMenuBar: true,
    icon: nativeImage.createFromDataURL(icon),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  window.once("ready-to-show", () => {
    window.webContents.setZoomFactor(1.1);
  });

  window.on("closed", function () {
    mainWindow = undefined;
  });

  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY).then(noop);
  window.webContents.openDevTools({mode: 'undocked'});

  return window;
};

app.on("ready", () => {
  setDefaultSettings();

  mainWindow = getWindow();

  // register IPC actions
  require("./ipc/dialog");
  require("./ipc/settings");
});

app.on("window-all-closed", () => {
  app.quit();
});

export { mainWindow };
