import settings from "electron-settings";

import { app } from "electron";

const setDefaultSettings = () => {
  if (!settings.hasSync("settings")) {
    const defaultSettings: WxSettings = {
      abc: false,
      xyz: true,
      download_root: app.getPath("downloads"),
    };

    settings.setSync("settings", defaultSettings);
  }
};

export { setDefaultSettings };
