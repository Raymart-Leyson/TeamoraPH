export const TIMEZONES = [
    { value: "Pacific/Midway", label: "Midway Island, Samoa (UTC-11)" },
    { value: "Pacific/Honolulu", label: "Hawaii (UTC-10)" },
    { value: "America/Anchorage", label: "Alaska (UTC-9)" },
    { value: "America/Los_Angeles", label: "Pacific Time (UTC-8)" },
    { value: "America/Denver", label: "Mountain Time (UTC-7)" },
    { value: "America/Chicago", label: "Central Time (UTC-6)" },
    { value: "America/New_York", label: "Eastern Time (UTC-5)" },
    { value: "America/Caracas", label: "Caracas (UTC-4)" },
    { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
    { value: "Atlantic/South_Georgia", label: "Mid-Atlantic (UTC-2)" },
    { value: "Atlantic/Azores", label: "Azores (UTC-1)" },
    { value: "Europe/London", label: "London, UK (UTC)" },
    { value: "Europe/Paris", label: "Central Europe (UTC+1)" },
    { value: "Europe/Athens", label: "Eastern Europe (UTC+2)" },
    { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
    { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
    { value: "Asia/Karachi", label: "Karachi, Islamabad (UTC+5)" },
    { value: "Asia/Dhaka", label: "Dhaka, Almaty (UTC+6)" },
    { value: "Asia/Jakarta", label: "Jakarta, Bangkok (UTC+7)" },
    { value: "Asia/Manila", label: "Manila, Singapore, Beijing (UTC+8)" },
    { value: "Asia/Tokyo", label: "Tokyo, Seoul (UTC+9)" },
    { value: "Australia/Sydney", label: "Sydney, Melbourne (UTC+10)" },
    { value: "Pacific/Noumea", label: "New Caledonia (UTC+11)" },
    { value: "Pacific/Auckland", label: "Auckland, Wellington (UTC+12)" }
];

export function formatTimezone(value: string | null | undefined): string {
    if (!value) return "Timezone";
    const tz = TIMEZONES.find((t) => t.value === value);
    return tz ? tz.label : value;
}
