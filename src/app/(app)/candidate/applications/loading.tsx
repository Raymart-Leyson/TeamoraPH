import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ApplicationsLoading() {
    return (
        <div className="flex-1 space-y-8 p-8 max-w-5xl mx-auto pt-10">
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
