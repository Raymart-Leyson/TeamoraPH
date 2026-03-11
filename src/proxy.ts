import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// CORS headers for the desktop tracker (Electron app)
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Tracker API routes: handle CORS only (no Supabase session needed)
    if (pathname.startsWith("/api/tracker")) {
        if (request.method === "OPTIONS") {
            return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
        }
        const response = NextResponse.next();
        for (const [key, value] of Object.entries(CORS_HEADERS)) {
            response.headers.set(key, value);
        }
        return response;
    }

    // All other routes: run Supabase session refresh + auth protection
    return updateSession(request);
}

export const config = {
    matcher: [
        "/api/tracker/:path*",
        "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|images/.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
