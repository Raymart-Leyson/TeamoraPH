import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t py-12 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1 space-y-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <BriefcaseBusiness className="h-6 w-6 text-primary" />
                            <span className="inline-block font-bold">Teamora</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Empowering remote teams with the best global talent. Secure, fast, and transparent.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Candidates</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/jobs" className="hover:text-foreground">Browse Jobs</Link></li>
                            <li><Link href="/companies" className="hover:text-foreground">Companies</Link></li>
                            <li><Link href="/signup" className="hover:text-foreground">Create Profile</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Employers</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/employer/post-job" className="hover:text-foreground">Post a Job</Link></li>
                            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t pt-8 flex text-sm text-muted-foreground flex-col md:flex-row justify-between items-center">
                    <p>© {new Date().getFullYear()} Teamora. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
