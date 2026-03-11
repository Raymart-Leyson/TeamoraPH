"use client";

interface Screenshot {
    id: string;
    url: string;
    captured_at: string;
}

export function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {screenshots.map((s) => (
                <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block overflow-hidden rounded-lg border border-slate-200 hover:border-[#1B3FA0]/40 transition-colors"
                >
                    <img
                        src={s.url}
                        alt={`Screenshot at ${new Date(s.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        className="w-full aspect-video object-cover bg-slate-100"
                        loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-medium">
                            {new Date(s.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </a>
            ))}
        </div>
    );
}
