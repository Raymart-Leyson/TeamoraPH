import { ElectronAPI } from "@electron-toolkit/preload";

interface TrackerAPI {
    // Store
    getStoreValue(key: string): Promise<unknown>;
    setStoreValue(key: string, value: unknown): Promise<void>;
    deleteStoreValue(key: string): Promise<void>;
    clearStorage(): Promise<void>;
    // Screen capture
    captureScreen(): Promise<string | null>;
    // Tray
    setTrayTracking(tracking: boolean): void;
    // Shell
    openUrl(url: string): void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
        tracker: TrackerAPI;
    }
}
