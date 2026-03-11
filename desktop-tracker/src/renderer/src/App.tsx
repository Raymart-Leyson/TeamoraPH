import { useState, useEffect } from "react";
import { PairingScreen } from "./screens/PairingScreen";
import { TrackerScreen } from "./screens/TrackerScreen";
import { trackerStore, type DeviceInfo } from "./services/store";

type AppState = "loading" | "unpaired" | "paired";

export default function App() {
    const [state, setState] = useState<AppState>("loading");
    const [device, setDevice] = useState<DeviceInfo | null>(null);

    // On mount, check if we already have a device token
    useEffect(() => {
        trackerStore.getDeviceInfo().then((info) => {
            if (info?.deviceToken) {
                setDevice(info);
                setState("paired");
            } else {
                setState("unpaired");
            }
        });
    }, []);

    const handlePaired = (info: DeviceInfo) => {
        setDevice(info);
        setState("paired");
    };

    const handleLogout = async () => {
        await trackerStore.clearAll();
        setDevice(null);
        setState("unpaired");
        window.tracker.setTrayTracking(false);
    };

    if (state === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#1B3FA0] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading…</p>
                </div>
            </div>
        );
    }

    if (state === "unpaired" || !device) {
        return <PairingScreen onPaired={handlePaired} />;
    }

    return <TrackerScreen device={device} onLogout={handleLogout} />;
}
