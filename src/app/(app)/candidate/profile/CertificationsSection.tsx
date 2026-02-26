"use client";

import { useState, useActionState } from "react";
import { addCertification, deleteCertification } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Award, Link2 } from "lucide-react";

export function CertificationsSection({ items }: { items: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [state, formAction, isPending] = useActionState(
        async (_prev: any, formData: FormData) => {
            const res = await addCertification(_prev, formData);
            if (res.success) setIsAdding(false);
            return res;
        },
        null
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-[#123C69] tracking-tight flex items-center gap-2">
                    <Award className="h-6 w-6" /> Certifications
                </h3>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} size="sm" className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-full px-4 shadow-sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Certificate
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-[#123C69]/20 shadow-md bg-white overflow-hidden rounded-[1.5rem] mb-6">
                    <form action={formAction}>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[#123C69] font-semibold">Certificate Name *</Label>
                                    <Input id="name" name="name" required className="shadow-inner" placeholder="e.g. AWS Certified..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="issuing_org" className="text-[#123C69] font-semibold">Issuing Organization *</Label>
                                    <Input id="issuing_org" name="issuing_org" required className="shadow-inner" placeholder="e.g. Amazon Web Services" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="issue_date" className="text-[#123C69] font-semibold">Issue Date</Label>
                                    <Input type="date" id="issue_date" name="issue_date" className="shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="credential_url" className="text-[#123C69] font-semibold">Credential URL</Label>
                                    <Input id="credential_url" name="credential_url" type="url" className="shadow-inner" placeholder="https://..." />
                                </div>
                            </div>

                            {state?.error && <p className="text-red-500 text-sm font-semibold">{state.error}</p>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#123C69]/10">
                                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="border-[#123C69]/20 text-[#123C69] rounded-xl font-bold">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-[#123C69] text-white hover:bg-[#123C69]/90 rounded-xl font-bold shadow-md">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Certification"}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.length === 0 && !isAdding && (
                    <div className="col-span-full p-8 bg-white/40 border border-[#123C69]/10 rounded-[2rem] text-center">
                        <p className="text-[#123C69]/60 font-medium">No certifications added yet.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.id} className="p-5 rounded-[1.5rem] bg-white border border-[#123C69]/10 shadow-sm relative group flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-[#123C69] leading-tight">
                                {item.name}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1 mb-3">
                                <Award className="h-3 w-3" /> {item.issuing_org}
                            </p>
                        </div>
                        {item.credential_url && (
                            <a href={item.credential_url} target="_blank" rel="noreferrer" className="text-[#AC3B61] text-xs font-bold hover:underline bg-[#AC3B61]/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1 max-w-max">
                                <Link2 className="h-3 w-3" /> View Credential
                            </a>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 shadow-md" onClick={async () => await deleteCertification(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
