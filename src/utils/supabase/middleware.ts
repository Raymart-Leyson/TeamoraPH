import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup");
    const isAppRoute = request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/candidate") || request.nextUrl.pathname.startsWith("/employer") || request.nextUrl.pathname.startsWith("/admin");

    if (
        !user &&
        isAppRoute
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        const redirectResponse = NextResponse.redirect(url);

        // Essential: Keep cookies from supabase on redirect to avoid refresh token loop
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    if (user && isAuthRoute) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const url = request.nextUrl.clone();

        if (profile?.role === 'employer') {
            url.pathname = "/employer/dashboard";
        } else if (profile?.role === 'admin' || profile?.role === 'staff') {
            url.pathname = "/admin";
        } else {
            url.pathname = "/candidate/dashboard";
        }
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    // Basic Role checks
    if (user && isAppRoute) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role;

        const isCandidateRoute = request.nextUrl.pathname.startsWith("/candidate");
        const isEmployerRoute = request.nextUrl.pathname.startsWith("/employer");
        const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

        if (isCandidateRoute && role !== 'candidate') {
            const url = request.nextUrl.clone();
            url.pathname = role === 'employer' ? "/employer/dashboard" : "/";
            const redirectResponse = NextResponse.redirect(url);
            supabaseResponse.cookies.getAll().forEach(cookie => { redirectResponse.cookies.set(cookie.name, cookie.value, cookie); });
            return redirectResponse;
        }
        if (isEmployerRoute && role !== 'employer') {
            const url = request.nextUrl.clone();
            url.pathname = role === 'candidate' ? "/candidate/dashboard" : "/";
            const redirectResponse = NextResponse.redirect(url);
            supabaseResponse.cookies.getAll().forEach(cookie => { redirectResponse.cookies.set(cookie.name, cookie.value, cookie); });
            return redirectResponse;
        }
        if (isAdminRoute && role !== 'admin' && role !== 'staff') {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            const redirectResponse = NextResponse.redirect(url);
            supabaseResponse.cookies.getAll().forEach(cookie => { redirectResponse.cookies.set(cookie.name, cookie.value, cookie); });
            return redirectResponse;
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
}
