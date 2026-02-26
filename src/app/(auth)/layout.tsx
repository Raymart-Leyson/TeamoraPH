import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
            <Link href="/" className="mb-8 flex items-center space-x-2">
                <BriefcaseBusiness className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Teamora</span>
            </Link>
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
