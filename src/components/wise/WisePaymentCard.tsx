"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";

interface WisePaymentCardProps {
    wiseReference: string;
    label: string;        // e.g. "Pro Talent" or "50 Credits"
    priceLabel: string;   // e.g. "₱699/month" or "₱199"
    accountNumber: string;
    accountHolderName: string;
    changeHref: string;
    changeLabel?: string;
    successMessage?: string;
}

export function WisePaymentCard({
    wiseReference,
    label,
    priceLabel,
    accountNumber,
    accountHolderName,
    changeHref,
    changeLabel = "Change",
    successMessage = "your payment will be automatically confirmed",
}: WisePaymentCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    function copy(value: string, field: string) {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-black text-[#1B3FA0] text-lg">{label}</p>
                    <p className="text-sm font-bold text-[#1B3FA0]/50">{priceLabel}</p>
                </div>
                <Link href={changeHref} className="text-xs font-bold text-[#3D6EFF] hover:underline">
                    {changeLabel}
                </Link>
            </div>

            <div className="bg-[#F0F4FF] rounded-2xl p-5 space-y-5">
                <p className="text-sm font-black text-[#1B3FA0]">
                    Send your payment to this Wise account:
                </p>

                <CopyRow
                    label="Account Number (InstaPay)"
                    value={accountNumber}
                    onCopy={() => copy(accountNumber, "account")}
                    copied={copiedField === "account"}
                />
                <CopyRow
                    label="Account Holder"
                    value={accountHolderName}
                    onCopy={() => copy(accountHolderName, "holder")}
                    copied={copiedField === "holder"}
                />
                <CopyRow
                    label="Amount"
                    value={priceLabel}
                    onCopy={() => copy(priceLabel, "amount")}
                    copied={copiedField === "amount"}
                />

                {/* Reference — most important */}
                <div className="bg-white rounded-xl p-4 border-2 border-[#3D6EFF]">
                    <p className="text-xs font-black text-[#3D6EFF] uppercase tracking-widest mb-2">
                        ⚠️ Important — Payment Reference
                    </p>
                    <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-[#1B3FA0] text-lg tracking-wider">
                            {wiseReference}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(wiseReference, "ref")}
                            className="text-[#3D6EFF] hover:bg-[#3D6EFF]/10 rounded-xl font-bold"
                        >
                            {copiedField === "ref" ? (
                                <><CheckCircle2 className="w-4 h-4 mr-1" /> Copied</>
                            ) : (
                                <><Copy className="w-4 h-4 mr-1" /> Copy</>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-[#1B3FA0]/50 mt-2 font-bold">
                        You MUST include this code in the transfer description / reference field so we can auto-detect your payment.
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <p className="text-sm font-bold text-amber-800">
                    Once you send the payment with the reference above,{" "}
                    <strong className="text-amber-900">{successMessage}</strong>.
                </p>
            </div>
        </div>
    );
}

function CopyRow({ label, value, onCopy, copied }: {
    label: string; value: string; onCopy: () => void; copied: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <p className="text-xs font-black text-[#1B3FA0]/40 uppercase tracking-widest">{label}</p>
                <p className="font-black text-[#1B3FA0]">{value}</p>
            </div>
            <button onClick={onCopy} className="text-[#3D6EFF] hover:text-[#1B3FA0] transition-colors">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    );
}
