"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export function PlanSelector({ planKey }: { planKey: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    function select() {
        setLoading(true);
        router.push(`/employer/billing?plan=${planKey}`);
    }

    return (
        <Button
            onClick={select}
            disabled={loading}
            className="w-full bg-[#1B3FA0] hover:bg-[#1B3FA0]/90 text-white font-black rounded-2xl"
        >
            {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting reference...</>
            ) : (
                <>Get Started <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
        </Button>
    );
}
