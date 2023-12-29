import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openXlsxDialog: (onDone: (selectedFile: string) => void, defaultPath: string) => {
    ipcRenderer.on("file-dialog-close", (event, selectedFile) => {
      onDone(selectedFile);
    });
    ipcRenderer.send(
      "file-dialog-open",
      [{ name: "Microsoft Excel File", extensions: ["xlsx", "xls"] }],
      defaultPath,
    );
  },

  openDirectoryDialog: (onDone: (selectedDirectory: string) => void, defaultPath: string) => {
    ipcRenderer.on("directory-dialog-close", (event, selectedDirectory) => {
      onDone(selectedDirectory);
    });
    ipcRenderer.send("directory-dialog-open", defaultPath);
  },

  subscribeToErrors: (onError: (err: any) => void) => {
    ipcRenderer.on("on-error", (event, err: any) => {
      onError(err);
    });
  },

  getDownloadsDirectory: (onDone: (downloadsDirectory: string) => void) => {
    ipcRenderer.on("downloads-directory-get", (event, downloadsDirectory: string) => {
      onDone(downloadsDirectory);
    });
    ipcRenderer.send("get-downloads-directory");
  },

  handleFinalSubmit: (submitData: SubmitData) =>
    ipcRenderer.invoke("handle-final-submit", submitData),
});
