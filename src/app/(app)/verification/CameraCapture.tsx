"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (blob: Blob, dataUrl: string) => void;
    onCancel?: () => void;
    label?: string;
    facingMode?: "user" | "environment";
}

export function CameraCapture({
    onCapture,
    onCancel,
    label = "Take Photo",
    facingMode = "user",
}: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [phase, setPhase] = useState<"preview" | "captured">("preview");
    const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const startCamera = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setIsLoading(false);
            }
        } catch (err: any) {
            setError("Camera not accessible. Please allow camera permissions and try again.");
            setIsLoading(false);
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    const capture = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror for selfie (user-facing camera)
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
            setCapturedDataUrl(dataUrl);
            setCapturedBlob(blob);
            setPhase("captured");
            stopCamera();
        }, "image/jpeg", 0.92);
    }, [facingMode, stopCamera]);

    const retake = useCallback(() => {
        setCapturedDataUrl(null);
        setCapturedBlob(null);
        setPhase("preview");
        startCamera();
    }, [startCamera]);

    const confirm = useCallback(() => {
        if (capturedBlob && capturedDataUrl) {
            onCapture(capturedBlob, capturedDataUrl);
        }
    }, [capturedBlob, capturedDataUrl, onCapture]);

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] w-full max-w-md mx-auto">
                {phase === "preview" ? (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                        />
                        {isLoading && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-semibold">
                                Starting camera...
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm font-semibold text-center px-4">
                                {error}
                            </div>
                        )}
                        {/* Overlay guide */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-4 border-2 border-white/30 rounded-xl" />
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                        </div>
                    </>
                ) : (
                    <img src={capturedDataUrl!} alt="Captured" className="w-full h-full object-cover" />
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-3 justify-center">
                {phase === "preview" ? (
                    <>
                        {onCancel && (
                            <Button variant="outline" onClick={onCancel} className="rounded-xl font-bold px-5">
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                        )}
                        <Button
                            onClick={capture}
                            disabled={isLoading || !!error}
                            className="bg-[#123C69] hover:bg-[#123C69]/90 text-white font-bold rounded-xl px-8"
                        >
                            <Camera className="w-4 h-4 mr-2" /> {label}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onClick={retake} className="rounded-xl font-bold px-5">
                            <RefreshCw className="w-4 h-4 mr-2" /> Retake
                        </Button>
                        <Button
                            onClick={confirm}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-8"
                        >
                            <Check className="w-4 h-4 mr-2" /> Use This Photo
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
