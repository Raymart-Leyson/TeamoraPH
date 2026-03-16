"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    imageSrc: string;
    onConfirm: (file: File) => void;
    onCancel: () => void;
    aspectRatio?: number;
    outputSize?: number; // square output px
}

async function getCroppedFile(
    imageSrc: string,
    pixelCrop: CropArea,
    outputSize: number
): Promise<File> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            resolve(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
    });
}

export function ImageCropModal({
    imageSrc,
    onConfirm,
    onCancel,
    aspectRatio = 1,
    outputSize = 400,
}: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const file = await getCroppedFile(imageSrc, croppedAreaPixels, outputSize);
            onConfirm(file);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="px-6 pt-6 pb-2">
                    <h2 className="text-lg font-bold text-[#1B3FA0]">Crop Photo</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Drag to reposition, scroll to zoom</p>
                </div>

                {/* Crop Area */}
                <div className="relative w-full" style={{ height: 320 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape="round"
                        showGrid={false}
                        style={{
                            containerStyle: { borderRadius: 0 },
                        }}
                    />
                </div>

                {/* Zoom slider */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium w-8">Zoom</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-[#3D6EFF]"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl border-[#1B3FA0]/20 text-[#1B3FA0]">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="rounded-xl bg-[#1B3FA0] text-white hover:bg-[#1B3FA0]/90"
                    >
                        {isProcessing ? "Processing…" : "Apply Crop"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
