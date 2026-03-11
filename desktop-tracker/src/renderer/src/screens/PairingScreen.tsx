import { useState } from "react";
import { ArrowRight, Loader2, ExternalLink, KeyRound, Monitor } from "lucide-react";
import { api } from "../services/api";
import { trackerStore, type DeviceInfo } from "../services/store";

interface Props {
    onPaired: (device: DeviceInfo) => void;
}

export function PairingScreen({ onPaired }: Props) {
    const [pairingCode, setPairingCode] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultDeviceName =
        typeof navigator !== "undefined"
            ? `${navigator.platform || "Desktop"} Tracker`
            : "Desktop Tracker";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const code = pairingCode.replace(/[-\s]/g, "").toUpperCase().trim();
        const name = (deviceName.trim() || defaultDeviceName).slice(0, 80);

        if (code.length < 6) {
            setError("Please enter a valid pairing code (at least 6 characters).");
            return;
        }

        setLoading(true);
        try {
            const result = await api.exchangePairingCode(code, name);

            const info: DeviceInfo = {
                deviceId: result.device_id,
                deviceToken: result.device_token,
                userId: result.user_id,
                deviceName: name,
            };

            await trackerStore.setDeviceInfo(info);
            onPaired(info);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
                setError("Invalid or expired pairing code. Generate a new one on the website.");
            } else if (msg.toLowerCase().includes("used")) {
                setError("This pairing code has already been used. Generate a new one.");
            } else {
                setError(`Connection failed: ${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (value: string) => {
        const clean = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
        if (clean.length > 4) {
            setPairingCode(`${clean.slice(0, 4)}-${clean.slice(4)}`);
        } else {
            setPairingCode(clean);
        }
    };

    const codeReady = pairingCode.replace("-", "").length >= 6;

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Drag region + top bar */}
            <div className="titlebar flex items-center gap-2 px-4 h-10 shrink-0 bg-[#1B3FA0]">
                <Monitor className="h-4 w-4 text-white/80" />
                <span className="text-sm font-semibold text-white">TeamoraPH Tracker</span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-auto flex flex-col items-center px-8 pt-8 pb-4">
                <div className="w-full max-w-sm space-y-5">
                    {/* Brand */}
                    <div className="text-center space-y-1">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1B3FA0] mb-3">
                            <KeyRound className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Pair This Device</h1>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            In TeamoraPH, go to{" "}
                            <span className="font-medium text-slate-700">Tracker → Pair New Device</span>{" "}
                            to get your code.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Pairing code */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">
                                Pairing Code
                            </label>
                            <input
                                className="input text-center text-2xl font-mono tracking-[0.25em] uppercase py-3 border-slate-300 focus:border-[#1B3FA0] placeholder:text-slate-300 placeholder:tracking-[0.2em] placeholder:text-xl"
                                placeholder="XXXX-XXXX"
                                value={pairingCode}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                autoComplete="off"
                                spellCheck={false}
                                autoFocus
                                maxLength={9}
                                disabled={loading}
                            />
                            <p className="text-[11px] text-slate-400 text-center">
                                Code expires in 10 minutes
                            </p>
                        </div>

                        {/* Device name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-500">
                                Device Name{" "}
                                <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <input
                                className="input"
                                placeholder={defaultDeviceName}
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                maxLength={80}
                                disabled={loading}
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !codeReady}
                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-lg transition-all duration-150"
                            style={{
                                background: loading || !codeReady
                                    ? "#94a3b8"
                                    : "linear-gradient(135deg, #1B3FA0 0%, #2d5bd4 100%)",
                                color: "white",
                                cursor: loading || !codeReady ? "not-allowed" : "pointer",
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Connecting…
                                </>
                            ) : (
                                <>
                                    Pair Device
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-100" />
                        <span className="text-[11px] text-slate-400">or</span>
                        <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Open website */}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-[#1B3FA0] hover:text-[#2d5bd4] font-medium py-2 rounded-lg hover:bg-[#1B3FA0]/5 transition-colors"
                        onClick={() =>
                            window.tracker.openUrl("https://teamora-ph-rose.vercel.app/candidate/tracker")
                        }
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open TeamoraPH in browser
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 shrink-0">
                <p className="text-[11px] text-center text-slate-400">
                    TeamoraPH Tracker · v1.0.0
                </p>
            </div>
        </div>
    );
}
