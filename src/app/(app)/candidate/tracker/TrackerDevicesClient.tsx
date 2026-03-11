"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Monitor, Plus, Trash2, Clock, Wifi, WifiOff, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createPairingCode, revokeDevice } from "./actions";
import type { TrackerDevice } from "@/lib/tracker/types";

interface Props {
    initialDevices: TrackerDevice[];
}

export function TrackerDevicesClient({ initialDevices }: Props) {
    const [devices, setDevices] = useState(initialDevices);
    const [isPending, startTransition] = useTransition();

    // Pairing modal state
    const [pairingOpen, setPairingOpen] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [pairingExpiresAt, setPairingExpiresAt] = useState<Date | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [copied, setCopied] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);

    // Revoke confirm state
    const [revokeTarget, setRevokeTarget] = useState<TrackerDevice | null>(null);

    // Countdown timer for pairing code
    useEffect(() => {
        if (!pairingExpiresAt) return;

        const tick = () => {
            const diff = Math.max(0, Math.floor((pairingExpiresAt.getTime() - Date.now()) / 1000));
            setSecondsLeft(diff);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [pairingExpiresAt]);

    const handleGenerateCode = useCallback(async () => {
        setGeneratingCode(true);
        setPairingCode(null);
        const result = await createPairingCode();
        setGeneratingCode(false);

        if (result.success) {
            setPairingCode(result.code);
            setPairingExpiresAt(new Date(result.expiresAt));
            setCopied(false);
        }
    }, []);

    const handleOpenPairing = useCallback(async () => {
        setPairingOpen(true);
        await handleGenerateCode();
    }, [handleGenerateCode]);

    const handleCopyCode = useCallback(() => {
        if (!pairingCode) return;
        navigator.clipboard.writeText(pairingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [pairingCode]);

    const handleRevoke = useCallback((device: TrackerDevice) => {
        setRevokeTarget(device);
    }, []);

    const confirmRevoke = useCallback(() => {
        if (!revokeTarget) return;
        const id = revokeTarget.id;
        startTransition(async () => {
            const result = await revokeDevice(id);
            if (result.success) {
                setDevices((prev) =>
                    prev.map((d) =>
                        d.id === id ? { ...d, is_active: false, revoked_at: new Date().toISOString() } : d
                    )
                );
            }
            setRevokeTarget(null);
        });
    }, [revokeTarget]);

    const formatLastSeen = (lastSeen: string | null) => {
        if (!lastSeen) return "Never";
        const d = new Date(lastSeen);
        const diffMs = Date.now() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString();
    };

    const formatCode = (code: string) => {
        // Display as XXXX-XXXX for readability
        return `${code.slice(0, 4)}-${code.slice(4)}`;
    };

    const codeExpired = secondsLeft === 0 && pairingCode !== null;
    const activeDevices = devices.filter((d) => d.is_active);
    const revokedDevices = devices.filter((d) => !d.is_active);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Tracker Devices</h2>
                    <p className="text-muted-foreground text-sm">
                        Pair your desktop app to start tracking time automatically.
                    </p>
                </div>
                <Button onClick={handleOpenPairing} className="bg-[#1B3FA0] hover:bg-[#1B3FA0]/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Pair New Device
                </Button>
            </div>

            {/* Active Devices */}
            {activeDevices.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Monitor className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="font-medium text-muted-foreground">No devices paired yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                            Click "Pair New Device" and enter the code in your desktop tracker app.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={handleOpenPairing}>
                            <Plus className="h-4 w-4 mr-2" />
                            Pair Your First Device
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {activeDevices.map((device) => (
                        <Card key={device.id} className="border-green-200/60 bg-green-50/30">
                            <CardContent className="flex items-center justify-between py-4 px-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-100">
                                        <Monitor className="h-5 w-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{device.device_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Wifi className="h-3 w-3 text-green-600" />
                                            <span className="text-xs text-muted-foreground">
                                                Last seen: {formatLastSeen(device.last_seen_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleRevoke(device)}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Revoked Devices */}
            {revokedDevices.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Revoked Devices</h3>
                    <div className="grid gap-2">
                        {revokedDevices.map((device) => (
                            <Card key={device.id} className="opacity-60 border-muted">
                                <CardContent className="flex items-center justify-between py-3 px-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-muted">
                                            <Monitor className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm line-through text-muted-foreground">
                                                {device.device_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <WifiOff className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    Revoked{" "}
                                                    {device.revoked_at
                                                        ? new Date(device.revoked_at).toLocaleDateString()
                                                        : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">Revoked</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Pairing Code Modal */}
            <Dialog open={pairingOpen} onOpenChange={setPairingOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-[#1B3FA0]" />
                            Pair Desktop Tracker
                        </DialogTitle>
                        <DialogDescription>
                            Enter this code in your TeamoraPH desktop tracker app. It expires in 10 minutes and can only be used once.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {generatingCode ? (
                            <div className="flex justify-center py-6">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : pairingCode ? (
                            <>
                                <div
                                    className="flex items-center justify-center gap-3 bg-[#1B3FA0]/5 border-2 border-[#1B3FA0]/20 rounded-xl py-6 cursor-pointer hover:bg-[#1B3FA0]/10 transition-colors"
                                    onClick={handleCopyCode}
                                >
                                    <span className="text-3xl font-mono font-bold tracking-[0.2em] text-[#1B3FA0] select-all">
                                        {formatCode(pairingCode)}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>

                                {!codeExpired ? (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            Expires in{" "}
                                            <span className={secondsLeft < 60 ? "text-red-500 font-semibold" : "font-medium"}>
                                                {Math.floor(secondsLeft / 60)}:
                                                {String(secondsLeft % 60).padStart(2, "0")}
                                            </span>
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-center">
                                        <p className="text-sm text-red-500 font-medium">Code expired</p>
                                        <Button variant="outline" size="sm" onClick={handleGenerateCode}>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Generate New Code
                                        </Button>
                                    </div>
                                )}

                                <p className="text-xs text-center text-muted-foreground">
                                    Open the desktop tracker app → Settings → Pair Device → Enter this code
                                </p>
                            </>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Revoke Confirm Dialog */}
            <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke this device?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{revokeTarget?.device_name}</strong> will be immediately disconnected and any active session will be stopped. This cannot be undone — you will need to pair the device again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmRevoke}
                        >
                            Revoke Device
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
