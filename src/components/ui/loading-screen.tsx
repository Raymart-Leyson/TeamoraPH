import Image from "next/image";

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FF]">
            {/* Logo */}
            <div className="flex flex-col items-center gap-5">
                <div className="relative w-16 h-16">
                    <Image
                        src="/logo.png"
                        alt="TeamoraPH"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <p className="text-xl font-black tracking-tight text-[#1B3FA0]">
                    TeamoraPH
                </p>

                {/* Animated dots */}
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D6EFF] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D6EFF] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3D6EFF] animate-bounce" />
                </div>
            </div>
        </div>
    );
}
