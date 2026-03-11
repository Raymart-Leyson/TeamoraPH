"use strict";
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
const store = new Store();
let mainWindow = null;
let tray = null;
let isQuitting = false;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 420,
    height: 600,
    minWidth: 380,
    minHeight: 520,
    resizable: true,
    frame: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function createTray() {
  const iconPath = path.join(__dirname, "../../resources/icon.png");
  const icon = electron.nativeImage.createFromPath(iconPath);
  tray = new electron.Tray(icon.resize({ width: 16, height: 16 }));
  const updateContextMenu = (tracking) => {
    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: tracking ? "⏺ Tracking active" : "⏸ Not tracking",
        enabled: false
      },
      { type: "separator" },
      {
        label: "Open Tracker",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          electron.app.quit();
        }
      }
    ]);
    tray?.setContextMenu(contextMenu);
  };
  updateContextMenu(false);
  tray.setToolTip("TeamoraPH Tracker");
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
  electron.ipcMain.on("tray:set-tracking", (_event, tracking) => {
    updateContextMenu(tracking);
    tray?.setToolTip(tracking ? "TeamoraPH Tracker – Tracking" : "TeamoraPH Tracker – Idle");
  });
}
electron.ipcMain.handle("store:get", (_event, key) => {
  return store.get(key) ?? null;
});
electron.ipcMain.handle("store:set", (_event, key, value) => {
  store.set(key, value);
});
electron.ipcMain.handle("store:delete", (_event, key) => {
  store.delete(key);
});
electron.ipcMain.handle("store:clear", () => {
  store.clear();
});
electron.ipcMain.handle("screen:capture", async () => {
  try {
    const sources = await electron.desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    if (!sources.length) return null;
    const primary = sources[0];
    const png = primary.thumbnail.toPNG();
    return png.toString("base64");
  } catch (err) {
    console.error("[main] Screenshot capture failed:", err);
    return null;
  }
});
electron.ipcMain.on("shell:open-url", (_event, url) => {
  electron.shell.openExternal(url);
});
electron.ipcMain.on("app:notify", (_event, title, body) => {
  electron.dialog.showMessageBox({
    type: "info",
    title,
    message: body
  });
});
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.teamoraph.tracker");
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  createTray();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});
const gotLock = electron.app.requestSingleInstanceLock();
if (!gotLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
electron.app.on("window-all-closed", () => {
});
electron.app.on("before-quit", () => {
  isQuitting = true;
});
