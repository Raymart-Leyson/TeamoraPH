"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

export interface PaymentMethod {
    id: string;
    label: string;
    logo: string;      // emoji or short label used as icon
    number: string;
    name: string;
    color: string;     // tailwind bg class for the tab
    textColor: string; // tailwind text class
}

interface PaymentOptionsProps {
    methods: PaymentMethod[];
    reference: string;
    amount: string;
}

export function PaymentOptions({ methods, reference, amount }: PaymentOptionsProps) {
    const [active, setActive] = useState(methods[0]?.id ?? "");
    const [copiedRef, setCopiedRef] = useState(false);
    const [copiedNum, setCopiedNum] = useState(false);

    const method = methods.find(m => m.id === active) ?? methods[0];

    function copy(text: string, which: "ref" | "num") {
        navigator.clipboard.writeText(text);
        if (which === "ref") { setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000); }
        else { setCopiedNum(true); setTimeout(() => setCopiedNum(false), 2000); }
    }

    if (!method) return null;

    return (
        <div className="space-y-3">
            {/* Method tabs */}
            <div className="flex flex-wrap gap-2">
                {methods.map(m => (
                    <button
                        key={m.id}
                        onClick={() => setActive(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                            active === m.id
                                ? `${m.color} ${m.textColor} shadow-sm`
                                : "bg-[#F0F4FF] text-[#1B3FA0]/50 hover:text-[#1B3FA0]"
                        }`}
                    >
                        {m.logo} {m.label}
                    </button>
                ))}
            </div>

            {/* Account details */}
            <div className="bg-[#F0F4FF] rounded-2xl p-4 space-y-3">
                <Row label="Account Name" value={method.name} />
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black text-[#1B3FA0]/50 uppercase tracking-wide shrink-0">
                        {method.id === "wise" ? "Account Number" : "Number"}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-black text-[#1B3FA0] text-sm">{method.number}</span>
                        <button onClick={() => copy(method.number, "num")} className="text-[#3D6EFF] hover:text-[#1B3FA0]">
                            {copiedNum ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
                <Row label="Amount" value={amount} highlight />
            </div>

            {/* Reference to include */}
            <div>
                <p className="text-xs font-black text-[#1B3FA0]/60 mb-2 uppercase tracking-wide">
                    {method.id === "bank" ? "Use this as your transaction reference / remarks" : "Type this in the Notes / Reference field"}
                </p>
                <div className="flex items-center gap-2 bg-[#3D6EFF]/5 border-2 border-dashed border-[#3D6EFF]/30 rounded-2xl px-4 py-3">
                    <span className="font-black text-[#3D6EFF] tracking-widest flex-1 text-sm">{reference}</span>
                    <button onClick={() => copy(reference, "ref")} className="text-[#3D6EFF] hover:text-[#1B3FA0] transition-colors">
                        {copiedRef ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-black text-[#1B3FA0]/50 uppercase tracking-wide shrink-0">{label}</span>
            <span className={`font-black text-right ${highlight ? "text-[#3D6EFF] text-base" : "text-[#1B3FA0] text-sm"}`}>{value}</span>
        </div>
    );
}
