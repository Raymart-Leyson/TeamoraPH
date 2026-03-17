import { getUserProfile } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";

export const metadata = { title: "Notification Settings | TeamoraPH" };

export default async function EmployerSettingsPage() {
    const profile = await getUserProfile();
    if (!profile || profile.role !== "employer") redirect("/login");

    const supabase = await createClient();
    const { data } = await supabase
        .from("profiles")
        .select("email_notif_messages, email_notif_applications")
        .eq("id", profile.id)
        .single();

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-primary">Notification Settings</h1>
                <p className="text-muted-foreground mt-1">Control which emails TeamoraPH sends you.</p>
            </div>
            <NotificationPreferencesForm
                emailNotifMessages={data?.email_notif_messages ?? true}
                emailNotifApplications={data?.email_notif_applications ?? true}
            />
        </div>
    );
}
