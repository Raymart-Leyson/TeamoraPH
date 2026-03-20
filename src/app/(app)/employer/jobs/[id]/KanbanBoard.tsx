"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, Briefcase, FileText, User, Star } from "lucide-react";
import Link from "next/link";
import { updateApplicationStatus, rateApplication } from "./actions";
import { cn } from "@/lib/utils";

// The possible statuses based on DB enum
const COLUMNS = [
    { id: "pending", title: "Pending", color: "bg-slate-100 border-slate-200" },
    { id: "shortlisted", title: "Shortlisted", color: "bg-blue-50 border-blue-200" },
    { id: "interviewing", title: "Interviewing", color: "bg-amber-50 border-amber-200" },
    { id: "hired", title: "Hired", color: "bg-emerald-50 border-emerald-200" },
    { id: "rejected", title: "Rejected", color: "bg-red-50 border-red-200" }
];

interface Applicant {
    id: string;
    status: string;
    created_at: string;
    rating?: number | null;
    candidate: any;
}

interface KanbanBoardProps {
    jobId: string;
    initialApplicants: Applicant[];
}

function KanbanStarRating({ appId, jobId, initial }: { appId: string; jobId: string; initial: number | null | undefined }) {
    const [rating, setRating] = useState<number>(initial ?? 0);
    const [hovered, setHovered] = useState(0);
    const [saving, setSaving] = useState(false);

    async function handleRate(star: number) {
        const newRating = rating === star ? 0 : star;
        setRating(newRating);
        setSaving(true);
        await rateApplication(appId, newRating, jobId);
        setSaving(false);
    }

    const display = hovered || rating;

    return (
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)} onClick={e => e.stopPropagation()}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => handleRate(star)} onMouseEnter={() => setHovered(star)} disabled={saving} className="transition-transform hover:scale-110 disabled:opacity-50">
                    <Star className={cn("h-3 w-3 transition-colors", display >= star ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300")} />
                </button>
            ))}
        </div>
    );
}

export function KanbanBoard({ jobId, initialApplicants }: KanbanBoardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setApplicants(initialApplicants); // Sync if server state changes
    }, [initialApplicants]);

    if (!isMounted) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Kanban Board...</div>;
    }

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        // If dropped in the same column at the same index, do nothing
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic UI update
        const updatedApplicants = applicants.map(app => {
            if (app.id === draggableId) {
                return { ...app, status: newStatus };
            }
            return app;
        });

        setApplicants(updatedApplicants);
        setIsPending(true);

        // Server update
        const res = await updateApplicationStatus(draggableId, newStatus, jobId);

        setIsPending(false);
        if (res?.error) {
            // Revert changes if error
            setApplicants(initialApplicants);
            toast.error("Failed to update status", { description: res.error });
        } else {
            toast.success("Applicant status updated");
        }
    };

    return (
        <div className="w-full overflow-x-auto pb-4">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 min-w-max">
                    {COLUMNS.map((column) => {
                        const columnApplicants = applicants.filter(app => app.status === column.id);

                        return (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        className={`flex flex-col rounded-xl border ${column.color} p-3 transition-colors w-[260px] shrink-0 duration-200 ${snapshot.isDraggingOver ? "opacity-80 ring-2 ring-primary/50" : ""}`}
                                        style={{ minHeight: "300px" }}
                                    >
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h3 className="font-bold text-[#1B3FA0] tracking-tight">{column.title}</h3>
                                            <Badge variant="secondary" className="bg-white/60 font-medium">
                                                {columnApplicants.length}
                                            </Badge>
                                        </div>

                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex-1 space-y-3"
                                        >
                                            {columnApplicants.map((app, index) => {
                                                const candidate = Array.isArray(app.candidate) ? app.candidate[0] : app.candidate;
                                                const name = candidate?.first_name && candidate?.last_name
                                                    ? `${candidate.first_name} ${candidate.last_name}`
                                                    : "Anonymous";

                                                return (
                                                    <Draggable key={app.id} draggableId={app.id} index={index}>
                                                        {(provided, snapshot) => {
                                                            const child = (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`bg-white rounded-lg shadow-sm border border-slate-200 p-4 select-none ${snapshot.isDragging ? "shadow-xl ring-2 ring-primary/20 z-50" : "hover:border-[#1B3FA0]/30"}`}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        ...(snapshot.isDropAnimating ? { transitionDuration: '0.001s' } : {})
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="flex flex-col">
                                                                            <h4 className="font-bold text-[#1B3FA0] leading-tight">{name}</h4>
                                                                            {candidate?.profile?.verification_status === 'verified' && (
                                                                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                                                                                    <ShieldCheck className="h-3 w-3" /> Verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                                                        {candidate?.bio || "No summary provided."}
                                                                    </p>

                                                                    <div className="pt-3 border-t border-slate-100 space-y-2">
                                                                        <KanbanStarRating appId={app.id} jobId={jobId} initial={app.rating} />
                                                                        <div className="flex items-center justify-between">
                                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                                            {new Date(app.created_at).toLocaleDateString()}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-500 hover:text-[#1B3FA0] hover:bg-slate-100 p-0" asChild>
                                                                                <Link href={`/candidates/${candidate?.id}`} target="_blank">
                                                                                    <User className="h-3 w-3 mr-1" /> Profile
                                                                                </Link>
                                                                            </Button>
                                                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#3D6EFF] hover:text-[#1B3FA0] hover:bg-slate-100 p-0" asChild>
                                                                                <Link href={`/employer/jobs/${jobId}/applications/${app.id}`}>
                                                                                    <FileText className="h-3 w-3 mr-1" /> Review
                                                                                </Link>
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            );

                                                            // Use portal to fix transform/fixed positioning offsets during drag
                                                            if (snapshot.isDragging && typeof document !== "undefined") {
                                                                return createPortal(child, document.body);
                                                            }
                                                            return child;
                                                        }}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>

            {isPending && (
                <div className="fixed bottom-4 right-4 bg-[#1B3FA0] text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
                    Updating status...
                </div>
            )}
        </div>
    );
}
