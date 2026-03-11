"use client";

import { useEffect, useState } from "react";

export function LocalTime({ iso, fallback = "—" }: { iso: string; fallback?: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <>{fallback}</>;

    // Ensure the ISO string is treated as UTC if it doesn't already have a timezone offset
    let validIso = iso;
    if (validIso && !validIso.endsWith("Z") && !validIso.includes("+") && !validIso.match(/-\d{2}:\d{2}$/)) {
        validIso += "Z";
    }

    const timeString = new Date(validIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return <>{timeString}</>;
}
