"use strict";
const electron = require("electron");
const electronAPI = {
  ipcRenderer: {
    send(channel, ...args) {
      electron.ipcRenderer.send(channel, ...args);
    },
    sendTo(webContentsId, channel, ...args) {
      const electronVer = process.versions.electron;
      const electronMajorVer = electronVer ? parseInt(electronVer.split(".")[0]) : 0;
      if (electronMajorVer >= 28) {
        throw new Error('"sendTo" method has been removed since Electron 28.');
      } else {
        electron.ipcRenderer.sendTo(webContentsId, channel, ...args);
      }
    },
    sendSync(channel, ...args) {
      return electron.ipcRenderer.sendSync(channel, ...args);
    },
    sendToHost(channel, ...args) {
      electron.ipcRenderer.sendToHost(channel, ...args);
    },
    postMessage(channel, message, transfer) {
      electron.ipcRenderer.postMessage(channel, message, transfer);
    },
    invoke(channel, ...args) {
      return electron.ipcRenderer.invoke(channel, ...args);
    },
    on(channel, listener) {
      electron.ipcRenderer.on(channel, listener);
      return () => {
        electron.ipcRenderer.removeListener(channel, listener);
      };
    },
    once(channel, listener) {
      electron.ipcRenderer.once(channel, listener);
      return () => {
        electron.ipcRenderer.removeListener(channel, listener);
      };
    },
    removeListener(channel, listener) {
      electron.ipcRenderer.removeListener(channel, listener);
      return this;
    },
    removeAllListeners(channel) {
      electron.ipcRenderer.removeAllListeners(channel);
    }
  },
  webFrame: {
    insertCSS(css) {
      return electron.webFrame.insertCSS(css);
    },
    setZoomFactor(factor) {
      if (typeof factor === "number" && factor > 0) {
        electron.webFrame.setZoomFactor(factor);
      }
    },
    setZoomLevel(level) {
      if (typeof level === "number") {
        electron.webFrame.setZoomLevel(level);
      }
    }
  },
  webUtils: {
    getPathForFile(file) {
      return electron.webUtils.getPathForFile(file);
    }
  },
  process: {
    get platform() {
      return process.platform;
    },
    get versions() {
      return process.versions;
    },
    get env() {
      return { ...process.env };
    }
  }
};
const trackerAPI = {
  // ── Store ─────────────────────────────────────────────────────
  /** Read a value from the main-process persistent store */
  getStoreValue: (key) => electron.ipcRenderer.invoke("store:get", key),
  /** Write a value to the main-process persistent store */
  setStoreValue: (key, value) => electron.ipcRenderer.invoke("store:set", key, value),
  /** Delete a key from the main-process persistent store */
  deleteStoreValue: (key) => electron.ipcRenderer.invoke("store:delete", key),
  /** Clear ALL data from the persistent store (logout) */
  clearStorage: () => electron.ipcRenderer.invoke("store:clear"),
  // ── Screenshots ───────────────────────────────────────────────
  /** Capture the primary screen. Returns base64-encoded PNG string, or null on failure. */
  captureScreen: () => electron.ipcRenderer.invoke("screen:capture"),
  // ── Tray ──────────────────────────────────────────────────────
  /** Update the tray icon and tooltip to reflect tracking state */
  setTrayTracking: (tracking) => electron.ipcRenderer.send("tray:set-tracking", tracking),
  // ── Shell / OS ────────────────────────────────────────────────
  /** Open a URL in the system browser */
  openUrl: (url) => electron.ipcRenderer.send("shell:open-url", url)
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", electronAPI);
    electron.contextBridge.exposeInMainWorld("tracker", trackerAPI);
  } catch (err) {
    console.error("Preload bridge error:", err);
  }
} else {
  window.electron = electronAPI;
  window.tracker = trackerAPI;
}
