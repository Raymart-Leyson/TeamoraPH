"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function RefreshButton() {
    const router = useRouter();
    const [spinning, setSpinning] = useState(false);

    function handleRefresh() {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 800);
    }

    return (
        <button
            onClick={handleRefresh}
            title="Refresh"
            className="p-1.5 rounded-md text-slate-400 hover:text-[#1B3FA0] hover:bg-[#1B3FA0]/10 transition-colors"
        >
            <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
        </button>
    );
}
