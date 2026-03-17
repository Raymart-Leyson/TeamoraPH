"use client";

import { useEffect } from "react";
import { updateLastSeen } from "@/app/(app)/actions";

export function LastSeenTracker() {
    useEffect(() => {
        updateLastSeen();
        const interval = setInterval(updateLastSeen, 2 * 60 * 1000); // every 2 minutes
        return () => clearInterval(interval);
    }, []);

    return null;
}
