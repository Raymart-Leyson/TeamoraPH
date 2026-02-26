"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signout } from "@/app/(auth)/actions";

export function LogoutButton() {
    return (
        <DropdownMenuItem onClick={() => signout()} className="w-full text-left flex text-destructive focus:text-destructive cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
        </DropdownMenuItem>
    );
}
