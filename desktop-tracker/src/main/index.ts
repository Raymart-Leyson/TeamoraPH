import {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    nativeImage,
    desktopCapturer,
    shell,
    dialog,
} from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import Store from "electron-store";

// ── Persistent store (main process owns this) ─────────────────────
const store = new Store<Record<string, unknown>>();

// ── Globals ───────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ── Window factory ────────────────────────────────────────────────
function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 420,
        height: 600,
        minWidth: 380,
        minHeight: 520,
        resizable: true,
        frame: true,
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        backgroundColor: "#ffffff",
        icon: join(__dirname, "../../resources/icon.png"),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow?.show();
    });

    // Minimize to tray instead of closing
    mainWindow.on("close", (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    // Dev: load vite dev server; Prod: load built file
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

// ── System Tray ───────────────────────────────────────────────────
function createTray(): void {
    const iconPath = join(__dirname, "../../resources/icon.png");
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const updateContextMenu = (tracking: boolean) => {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: tracking ? "⏺ Tracking active" : "⏸ Not tracking",
                enabled: false,
            },
            { type: "separator" },
            {
                label: "Open Tracker",
                click: () => {
                    mainWindow?.show();
                    mainWindow?.focus();
                },
            },
            { type: "separator" },
            {
                label: "Quit",
                click: () => {
                    isQuitting = true;
                    app.quit();
                },
            },
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

    // Allow renderer to update tray status
    ipcMain.on("tray:set-tracking", (_event, tracking: boolean) => {
        updateContextMenu(tracking);
        tray?.setToolTip(tracking ? "TeamoraPH Tracker – Tracking" : "TeamoraPH Tracker – Idle");
    });
}

// ── IPC Handlers ──────────────────────────────────────────────────

// Persistent store — renderer reads/writes through these
ipcMain.handle("store:get", (_event, key: string) => {
    return store.get(key) ?? null;
});

ipcMain.handle("store:set", (_event, key: string, value: unknown) => {
    store.set(key, value);
});

ipcMain.handle("store:delete", (_event, key: string) => {
    store.delete(key);
});

ipcMain.handle("store:clear", () => {
    store.clear();
});

// Screenshot capture using desktopCapturer
ipcMain.handle("screen:capture", async (): Promise<string | null> => {
    try {
        const sources = await desktopCapturer.getSources({
            types: ["screen"],
            thumbnailSize: { width: 1920, height: 1080 },
        });

        if (!sources.length) return null;

        // Prefer the primary display (usually index 0)
        const primary = sources[0];
        const png = primary.thumbnail.toPNG();
        return png.toString("base64");
    } catch (err) {
        console.error("[main] Screenshot capture failed:", err);
        return null;
    }
});

// Open URL in system browser
ipcMain.on("shell:open-url", (_event, url: string) => {
    shell.openExternal(url);
});

// Show native notification
ipcMain.on("app:notify", (_event, title: string, body: string) => {
    dialog.showMessageBox({
        type: "info",
        title,
        message: body,
    });
});

// ── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(() => {
    // Set app user model ID for Windows notifications
    electronApp.setAppUserModelId("com.teamoraph.tracker");

    // Keyboard shortcut optimizer in dev
    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    createWindow();
    createTray();

    app.on("activate", () => {
        // macOS: re-open window on dock click
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow?.show();
        }
    });
});

// Enforce single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.on("window-all-closed", () => {
    // Keep alive in system tray on all platforms
    // Only quit via tray menu
});

app.on("before-quit", () => {
    isQuitting = true;
});
