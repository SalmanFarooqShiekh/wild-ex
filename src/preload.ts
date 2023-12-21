import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openXlsxDialog: (onDone: (selectedFile: string) => void, defaultPath: string) => {
    ipcRenderer.send("file-dialog-open", [{ name: "Microsoft Excel File", extensions: ["xlsx", "xls"] }], defaultPath);
    ipcRenderer.on("file-dialog-close", (event, selectedFile) => {
      onDone(selectedFile);
    });
  },

  openDirectoryDialog: (onDone: (selectedDirectory: string) => void, defaultPath: string) => {
    ipcRenderer.send("directory-dialog-open", defaultPath);
    ipcRenderer.on("directory-dialog-close", (event, selectedDirectory) => {
      onDone(selectedDirectory);
    });
  },

  getSettings: (onDone: (settingsReturned: WxSettings) => void) => {
    ipcRenderer.send("get-settings");
    ipcRenderer.on("settings-get", (event, settingsReturned: WxSettings) => {
      onDone(settingsReturned);
    });
  },

  setSettings: (wxSettings: WxSettings, onDone: (settingsReturned: WxSettings) => void) => {
    ipcRenderer.send("set-settings", wxSettings);
    ipcRenderer.on("settings-set", (event, settingsReturned: WxSettings) => {
      onDone(settingsReturned);
    });
  },

  subscribeToErrors: (onError: (err: any) => void) => {
    ipcRenderer.on("on-error", (event, err: any) => {
      onError(err);
    });
  },

  getDownloadsDirectory: (onDone: (downloadsDirectory: string) => void) => {
    ipcRenderer.send("get-downloads-directory");
    ipcRenderer.on("downloads-directory-get", (event, downloadsDirectory: string) => {
      onDone(downloadsDirectory);
    });
  },

  moveMouseToElement: (elementPosition: number[]) => {
    ipcRenderer.send("move-mouse-to-element", elementPosition);
  },
});
