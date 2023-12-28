import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import MakerDMG from "@electron-forge/maker-dmg";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import MakerZIP from "@electron-forge/maker-zip";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { mainConfig } from "./webpack.main.config";

import { rendererConfig } from "./webpack.renderer.config";
import { join } from "path";

const icon_path = join(__dirname, "/src/assets/icon.png");

const config: ForgeConfig = {
  packagerConfig: {
    // asar: {
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   unpack: [ "**/node_modules/sharp/**/*", "**/node_modules/@img/**/*" ]
    // },
    asar: true,
    icon: icon_path,
  },
  rebuildConfig: {},
  makers: [
    // new MakerSquirrel({}),
    new MakerDMG({ name: "WildEx", icon: icon_path, overwrite: true }),
    new MakerZIP({}),
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
    // {
    //   name: '@electron-forge/plugin-auto-unpack-natives',
    //   config: {}
    // },
  ],
};

export default config;
