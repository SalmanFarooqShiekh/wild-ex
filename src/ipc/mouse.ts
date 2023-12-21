import { app, ipcMain } from "electron";
import { mainWindow } from "../index";
import settings from "electron-settings";
import { default_on_error } from "../helpers/ipc";

import robot from "robotjs";

ipcMain.on("move-mouse-to-element", async (event, elementPosition: number[]) => {
  const windowPosition = mainWindow.getPosition();
  elementPosition = [windowPosition[0] + elementPosition[0], windowPosition[1] + elementPosition[1]];

  console.log(windowPosition[0], elementPosition[0], windowPosition[1], elementPosition[1]);
  console.log({ elementPosition });

  if (elementPosition) {
    robot.moveMouse(elementPosition[0], elementPosition[1]);
  }
});
