import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerJobsLoading() {
    return (
        <div className="flex-1 space-y-8 p-8 max-w-5xl mx-auto pt-10">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-44" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-56" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
