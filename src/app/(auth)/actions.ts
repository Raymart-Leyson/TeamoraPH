"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
    const supabase = await createClient();

    // type-casting here for convenience
    // in production, use a schema library like Zod to validate
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    revalidatePath("/", "layout");

    if (profile?.role === "employer") {
        redirect("/employer/dashboard");
    } else if (profile?.role === "admin") {
        redirect("/admin/dashboard");
    } else {
        redirect("/candidate/dashboard");
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as "candidate" | "employer";
    const acceptTerms = formData.get("accept_terms") as string;

    if (!email || !password || !role) {
        return { error: "Email, password, and role are required" };
    }

    if (acceptTerms !== "yes") {
        return { error: "You must accept the Terms of Service and Privacy Policy to create an account." };
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: role,
            }
        }
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");

    if (role === "employer") {
        redirect("/employer/dashboard");
    } else {
        redirect("/candidate/dashboard");
    }
}

export async function signout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
}
