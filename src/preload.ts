import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openXlsxDialog: (initial: string): Promise<string> =>
    ipcRenderer.invoke("file-dialog-open", [{ name: "Microsoft Excel File", extensions: ["xlsx", "xls"] }], initial),

  openDirectoryDialog: (initial: string): Promise<string> => ipcRenderer.invoke("directory-dialog-open", initial),

  getDownloadsDirectory: (): Promise<string> => ipcRenderer.invoke("get-downloads-directory"),

  haltFinalSubmit: (): Promise<void> => ipcRenderer.invoke("halt-final-submit"),

  handleFinalSubmit: (sd: SubmitData): Promise<Done> => ipcRenderer.invoke("handle-final-submit", sd),
});
