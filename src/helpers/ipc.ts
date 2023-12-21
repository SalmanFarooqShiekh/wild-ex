import { mainWindow } from "../index";

const default_on_error = (err: any) => {
  mainWindow?.webContents.send("on-error", err);
};

export { default_on_error };
