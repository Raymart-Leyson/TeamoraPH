import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Search, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
            <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Brand mark */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <BriefcaseBusiness className="h-10 w-10 text-primary" />
                    </div>
                </div>

                {/* Error code */}
                <div className="space-y-2">
                    <p className="text-7xl font-extrabold text-primary">404</p>
                    <h1 className="text-2xl font-bold">Page not found</h1>
                    <p className="text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button asChild size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/jobs">
                            <Search className="mr-2 h-4 w-4" />
                            Browse Jobs
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
