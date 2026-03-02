import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Handles Supabase auth callbacks:
// - Google OAuth redirect (login & signup)
// - Password reset links from email
// Supabase redirects to /auth/callback?code=...
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const code = searchParams.get("code");
    const type = searchParams.get("type");     // "recovery" for password reset
    const role = searchParams.get("role");      // "candidate" | "employer" from signup

    if (code) {
        const supabase = await createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            // --- Password reset flow ---
            if (type === "recovery") {
                return NextResponse.redirect(`${origin}/login/reset-password`);
            }

            // --- Google OAuth flow ---
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check existing profile
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .maybeSingle();

                const existingRole = profile?.role;

                // If new user (profile created by trigger but might have no role, or role needs setting from OAuth)
                if (role && (!existingRole || existingRole === "candidate") && role !== existingRole) {
                    // Only set the role if it's a valid signup role
                    if (role === "candidate" || role === "employer") {
                        await supabase
                            .from("profiles")
                            .update({ role })
                            .eq("id", user.id);

                        // Route to the right dashboard
                        const dashboardUrl = role === "employer"
                            ? `${origin}/employer/dashboard`
                            : `${origin}/candidate/dashboard`;
                        return NextResponse.redirect(dashboardUrl);
                    }
                }

                // Existing user — route to their existing dashboard
                const dashboardMap: Record<string, string> = {
                    employer: `${origin}/employer/dashboard`,
                    owner: `${origin}/owner/dashboard`,
                    admin: `${origin}/admin/dashboard`,
                    staff: `${origin}/staff/dashboard`,
                    candidate: `${origin}/candidate/dashboard`,
                };

                const destination = dashboardMap[existingRole ?? "candidate"] ?? `${origin}/candidate/dashboard`;
                return NextResponse.redirect(destination);
            }
        }
    }

    // Something went wrong — send to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
