"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { KanbanBoard } from "./KanbanBoard";
import { ApplicantsList } from "./ApplicantsList";

interface ApplicantsViewProps {
    jobId: string;
    applicants: any[];
}

export function ApplicantsView({ jobId, applicants }: ApplicantsViewProps) {
    const [view, setView] = useState<"board" | "list">("list");

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        view === "list"
                            ? "bg-white text-[#1B3FA0] shadow-sm"
                            : "text-slate-500 hover:text-[#1B3FA0]"
                    }`}
                >
                    <List className="h-4 w-4" /> List
                </button>
                <button
                    type="button"
                    onClick={() => setView("board")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        view === "board"
                            ? "bg-white text-[#1B3FA0] shadow-sm"
                            : "text-slate-500 hover:text-[#1B3FA0]"
                    }`}
                >
                    <LayoutGrid className="h-4 w-4" /> Board
                </button>
            </div>

            {view === "list" ? (
                <ApplicantsList jobId={jobId} applicants={applicants} />
            ) : (
                <KanbanBoard jobId={jobId} initialApplicants={applicants} />
            )}
        </div>
    );
}
