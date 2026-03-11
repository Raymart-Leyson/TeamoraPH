import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// ── Tracker API bridge ────────────────────────────────────────────
// Exposed to the renderer via window.tracker
// The renderer CANNOT access Node.js APIs directly — everything goes
// through this bridge for security.

const trackerAPI = {
    // ── Store ─────────────────────────────────────────────────────
    /** Read a value from the main-process persistent store */
    getStoreValue: (key: string): Promise<unknown> =>
        ipcRenderer.invoke("store:get", key),

    /** Write a value to the main-process persistent store */
    setStoreValue: (key: string, value: unknown): Promise<void> =>
        ipcRenderer.invoke("store:set", key, value),

    /** Delete a key from the main-process persistent store */
    deleteStoreValue: (key: string): Promise<void> =>
        ipcRenderer.invoke("store:delete", key),

    /** Clear ALL data from the persistent store (logout) */
    clearStorage: (): Promise<void> =>
        ipcRenderer.invoke("store:clear"),

    // ── Screenshots ───────────────────────────────────────────────
    /** Capture the primary screen. Returns base64-encoded PNG string, or null on failure. */
    captureScreen: (): Promise<string | null> =>
        ipcRenderer.invoke("screen:capture"),

    // ── Tray ──────────────────────────────────────────────────────
    /** Update the tray icon and tooltip to reflect tracking state */
    setTrayTracking: (tracking: boolean): void =>
        ipcRenderer.send("tray:set-tracking", tracking),

    // ── Shell / OS ────────────────────────────────────────────────
    /** Open a URL in the system browser */
    openUrl: (url: string): void =>
        ipcRenderer.send("shell:open-url", url),
};

// Expose in sandboxed renderer
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("tracker", trackerAPI);
    } catch (err) {
        console.error("Preload bridge error:", err);
    }
} else {
    // @ts-ignore
    window.electron = electronAPI;
    // @ts-ignore
    window.tracker = trackerAPI;
}
