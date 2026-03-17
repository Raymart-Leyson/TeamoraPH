"use client";

import { useActionState } from "react";
import { updateNotificationPreferences } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, MessageSquare, Briefcase } from "lucide-react";

export function NotificationPreferencesForm({
    emailNotifMessages,
    emailNotifApplications,
}: {
    emailNotifMessages: boolean;
    emailNotifApplications: boolean;
}) {
    const [state, formAction, isPending] = useActionState(
        async (_: unknown, formData: FormData) => updateNotificationPreferences(formData),
        null
    );

    return (
        <form action={formAction} className="space-y-4">
            <div className="bg-background border rounded-2xl divide-y">
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">New Message Emails</p>
                            <p className="text-xs text-muted-foreground">Get an email when someone sends you a message while you&apos;re offline.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="email_notif_messages"
                            defaultChecked={emailNotifMessages}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                </div>

                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Application Update Emails</p>
                            <p className="text-xs text-muted-foreground">Get an email when your application status changes.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="email_notif_applications"
                            defaultChecked={emailNotifApplications}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                </div>
            </div>

            {state?.error && (
                <p className="text-sm text-destructive font-medium">{state.error}</p>
            )}
            {state?.success && (
                <p className="text-sm text-green-600 font-medium">Preferences saved.</p>
            )}

            <Button type="submit" disabled={isPending} className="rounded-xl font-bold">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                Save Preferences
            </Button>
        </form>
    );
}
