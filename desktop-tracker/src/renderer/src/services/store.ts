// ── Store service ─────────────────────────────────────────────────
// Wraps the IPC-based electron-store bridge with typed helpers.
// All values go through the main process; nothing is stored in
// localStorage or sessionStorage.

export interface DeviceInfo {
    deviceId: string;
    deviceToken: string;
    userId: string;
    deviceName: string;
}

const KEYS = {
    DEVICE_INFO: "deviceInfo",
    API_BASE_URL: "apiBaseUrl",
} as const;

// ── Default production API URL ─────────────────────────────────────
// Update this to match your deployment domain.
const DEFAULT_API_URL = "https://teamora-ph-rose.vercel.app";

export const trackerStore = {
    async getDeviceInfo(): Promise<DeviceInfo | null> {
        const raw = await window.tracker.getStoreValue(KEYS.DEVICE_INFO);
        if (!raw || typeof raw !== "string") return null;
        try {
            return JSON.parse(raw) as DeviceInfo;
        } catch {
            return null;
        }
    },

    async setDeviceInfo(info: DeviceInfo): Promise<void> {
        await window.tracker.setStoreValue(KEYS.DEVICE_INFO, JSON.stringify(info));
    },

    async clearDeviceInfo(): Promise<void> {
        await window.tracker.deleteStoreValue(KEYS.DEVICE_INFO);
    },

    async getApiBaseUrl(): Promise<string> {
        const url = await window.tracker.getStoreValue(KEYS.API_BASE_URL);
        return typeof url === "string" && url ? url : DEFAULT_API_URL;
    },

    async setApiBaseUrl(url: string): Promise<void> {
        await window.tracker.setStoreValue(KEYS.API_BASE_URL, url.trim().replace(/\/$/, ""));
    },

    async clearAll(): Promise<void> {
        await window.tracker.clearStorage();
    },
};
