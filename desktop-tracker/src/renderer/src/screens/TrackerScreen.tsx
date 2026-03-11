import { useState, useEffect, useRef, useCallback } from "react";
import {
    Play,
    Square,
    Monitor,
    Camera,
    Activity,
    Clock,
    Wifi,
    WifiOff,
    LogOut,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";
import type { DeviceInfo } from "../services/store";

interface Props {
    device: DeviceInfo;
    onLogout: () => void;
}

type Phase = "idle" | "starting" | "tracking" | "stopping";

const HEARTBEAT_INTERVAL_MS = 30_000;       // 30 seconds
const SCREENSHOT_INTERVAL_MS = 10 * 60_000; // 10 minutes

// Convert base64 PNG string to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
}

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TrackerScreen({ device, onLogout }: Props) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [screenshotCount, setScreenshotCount] = useState(0);
    const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Activity counters (reset each heartbeat interval)
    const activityRef = useRef({ keyboard: 0, mouse: 0 });

    // Interval refs (cleaned up on stop)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const screenshotRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Track online/offline
    useEffect(() => {
        const online = () => setIsOnline(true);
        const offline = () => setIsOnline(false);
        window.addEventListener("online", online);
        window.addEventListener("offline", offline);
        return () => {
            window.removeEventListener("online", online);
            window.removeEventListener("offline", offline);
        };
    }, []);

    // Track keyboard/mouse activity (within the app window)
    useEffect(() => {
        if (phase !== "tracking") return;
        const onKey = () => activityRef.current.keyboard++;
        const onMouse = () => activityRef.current.mouse++;
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousemove", onMouse);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousemove", onMouse);
        };
    }, [phase]);

    // Screenshot upload helper
    const uploadScreenshot = useCallback(
        async (sid: string) => {
            setStatusMsg("📸 Capturing screenshot…");
            try {
                const base64 = await window.tracker.captureScreen();
                if (!base64) {
                    console.warn("Screenshot capture returned null");
                    setStatusMsg(null);
                    return;
                }

                const capturedAt = new Date().toISOString();

                // Step 1: Request signed upload URL
                const { screenshot_id, upload_url, storage_path } =
                    await api.requestScreenshotUpload(device, sid, capturedAt);

                setStatusMsg("⬆️ Uploading screenshot…");

                // Step 2: Upload PNG directly to Supabase Storage (no server proxy)
                const blob = base64ToBlob(base64, "image/png");
                const uploadRes = await fetch(upload_url, {
                    method: "PUT",
                    body: blob,
                    headers: { "Content-Type": "image/png" },
                });

                const uploaded = uploadRes.ok;

                // Step 3: Confirm result
                await api.confirmScreenshotUpload(
                    device,
                    screenshot_id,
                    storage_path,
                    blob.size,
                    uploaded ? "uploaded" : "failed"
                );

                if (uploaded) {
                    setScreenshotCount((n) => n + 1);
                    setStatusMsg("✓ Screenshot saved");
                } else {
                    setStatusMsg("⚠️ Screenshot upload failed, will retry");
                    console.warn("Screenshot upload failed:", uploadRes.status);
                }
            } catch (err) {
                console.error("Screenshot error:", err);
                setStatusMsg("⚠️ Screenshot error");
            }

            setTimeout(() => setStatusMsg(null), 3000);
        },
        [device]
    );

    // Heartbeat sender
    const sendHeartbeat = useCallback(
        async (sid: string) => {
            const { keyboard, mouse } = activityRef.current;
            activityRef.current = { keyboard: 0, mouse: 0 };

            try {
                await api.sendHeartbeat(device, {
                    session_id: sid,
                    keyboard_events: keyboard,
                    mouse_events: mouse,
                    logged_at: new Date().toISOString(),
                });
                setLastHeartbeat(new Date());
            } catch (err) {
                console.warn("Heartbeat failed:", err);
                // Non-fatal — session will be auto-abandoned by the server if
                // heartbeats stop for >5 minutes
            }
        },
        [device]
    );

    // Clear all intervals
    const clearIntervals = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
        if (screenshotRef.current) { clearInterval(screenshotRef.current); screenshotRef.current = null; }
    }, []);

    // Start tracking
    const handleStart = async () => {
        setError(null);
        setPhase("starting");
        try {
            const { session_id } = await api.startSession(device);

            setSessionId(session_id);
            setElapsedSeconds(0);
            setScreenshotCount(0);
            setLastHeartbeat(null);
            activityRef.current = { keyboard: 0, mouse: 0 };
            setPhase("tracking");

            window.tracker.setTrayTracking(true);

            // Elapsed timer: +1 second
            timerRef.current = setInterval(() => {
                setElapsedSeconds((s) => s + 1);
            }, 1000);

            // Heartbeat every 30 seconds
            heartbeatRef.current = setInterval(() => {
                sendHeartbeat(session_id);
            }, HEARTBEAT_INTERVAL_MS);

            // Screenshot every 10 minutes
            // First screenshot after 1 minute so user sees it's working
            screenshotRef.current = setInterval(() => {
                uploadScreenshot(session_id);
            }, SCREENSHOT_INTERVAL_MS);

            // First heartbeat immediately
            await sendHeartbeat(session_id);

            // First screenshot after 60 seconds (not instantly)
            setTimeout(() => uploadScreenshot(session_id), 60_000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to start session";
            setError(msg);
            setPhase("idle");
        }
    };

    // Stop tracking
    const handleStop = async () => {
        if (!sessionId) return;
        setPhase("stopping");
        clearIntervals();
        window.tracker.setTrayTracking(false);

        try {
            await api.endSession(device, sessionId);
        } catch (err) {
            console.error("Failed to end session cleanly:", err);
            // Session will be auto-abandoned by the server after 5 min of no heartbeats
        }

        setSessionId(null);
        setPhase("idle");
        setStatusMsg(null);
    };

    // Cleanup on unmount
    useEffect(() => clearIntervals, [clearIntervals]);

    const isTracking = phase === "tracking";
    const isBusy = phase === "starting" || phase === "stopping";

    const heartbeatAgeSeconds = lastHeartbeat
        ? Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000)
        : null;
    const heartbeatStale = heartbeatAgeSeconds !== null && heartbeatAgeSeconds > 60;

    return (
        <div className="h-screen flex flex-col bg-white select-none">
            {/* Titlebar */}
            <div className="titlebar flex items-center justify-between px-5 py-3 bg-[#1B3FA0] shrink-0">
                <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-white/80" />
                    <span className="font-semibold text-sm text-white">TeamoraPH Tracker</span>
                </div>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-300" />
                    ) : (
                        <WifiOff className="h-4 w-4 text-red-300" />
                    )}
                    <button
                        title="Disconnect device (logout)"
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={onLogout}
                        disabled={isTracking}
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 overflow-auto py-6">
                {/* Timer display */}
                <div className="text-center">
                    <div
                        className={`relative w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            isTracking
                                ? "bg-[#1B3FA0]/10 pulse-ring"
                                : "bg-slate-100"
                        }`}
                    >
                        <div className="text-center">
                            <p
                                className={`text-2xl font-mono font-bold tabular-nums ${
                                    isTracking ? "text-[#1B3FA0]" : "text-slate-400"
                                }`}
                            >
                                {formatElapsed(elapsedSeconds)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {isTracking ? "elapsed" : "not tracking"}
                            </p>
                        </div>
                    </div>

                    {isTracking && (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Session active
                        </div>
                    )}
                </div>

                {/* Stats row */}
                {isTracking && (
                    <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                        <div className="card p-3 text-center">
                            <Camera className="h-4 w-4 text-[#3D6EFF] mx-auto mb-1" />
                            <p className="text-lg font-bold text-slate-700 tabular-nums">{screenshotCount}</p>
                            <p className="text-xs text-slate-500">Screenshots</p>
                        </div>
                        <div className="card p-3 text-center">
                            <Activity className="h-4 w-4 text-[#3D6EFF] mx-auto mb-1" />
                            <p className="text-xs text-slate-700 tabular-nums font-semibold">
                                {lastHeartbeat
                                    ? `${heartbeatAgeSeconds}s ago`
                                    : "Pending…"}
                            </p>
                            <p className="text-xs text-slate-500">Last heartbeat</p>
                            {heartbeatStale && (
                                <p className="text-[10px] text-amber-600 mt-0.5 font-medium">Check connection</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Status message */}
                {statusMsg && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full max-w-xs">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{statusMsg}</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full max-w-xs">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Start / Stop button */}
                <div className="w-full max-w-xs">
                    {!isTracking ? (
                        <button
                            onClick={handleStart}
                            disabled={isBusy || !isOnline}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
                        >
                            {phase === "starting" ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Starting…
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5 fill-current" />
                                    Start Tracking
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            disabled={isBusy}
                            className="btn-danger w-full flex items-center justify-center gap-2 py-3 text-base"
                        >
                            {phase === "stopping" ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Stopping…
                                </>
                            ) : (
                                <>
                                    <Square className="h-5 w-5 fill-current" />
                                    Stop Tracking
                                </>
                            )}
                        </button>
                    )}

                    {!isOnline && (
                        <p className="text-xs text-center text-amber-600 mt-2">
                            You're offline — connect to the internet to start tracking.
                        </p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-500 truncate max-w-[55%]">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        {device.deviceName}
                    </span>
                    <span>Screenshots every 10 min</span>
                </div>
            </div>
        </div>
    );
}
