import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TeamoraPH — Remote Job Marketplace for Filipino Talent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "1200px",
                    height: "630px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0D1B4B 0%, #1B3FA0 50%, #3D6EFF 100%)",
                    fontFamily: "sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background blobs */}
                <div
                    style={{
                        position: "absolute",
                        top: "-100px",
                        right: "-100px",
                        width: "500px",
                        height: "500px",
                        borderRadius: "50%",
                        background: "rgba(61,110,255,0.25)",
                        filter: "blur(80px)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-80px",
                        left: "-80px",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: "rgba(168,196,255,0.15)",
                        filter: "blur(80px)",
                    }}
                />

                {/* Logo + wordmark */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "40px",
                    }}
                >
                    <div
                        style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "18px",
                            background: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid rgba(255,255,255,0.3)",
                        }}
                    >
                        {/* Simple briefcase icon */}
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="7" width="20" height="14" rx="2" fill="white" opacity="0.9" />
                            <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="white" strokeWidth="2" />
                            <line x1="2" y1="13" x2="22" y2="13" stroke="#1B3FA0" strokeWidth="2" />
                        </svg>
                    </div>
                    <span
                        style={{
                            fontSize: "52px",
                            fontWeight: "900",
                            color: "white",
                            letterSpacing: "-1px",
                        }}
                    >
                        Teamora<span style={{ color: "#7BA7FF" }}>PH</span>
                    </span>
                </div>

                {/* Headline */}
                <div
                    style={{
                        fontSize: "44px",
                        fontWeight: "800",
                        color: "white",
                        textAlign: "center",
                        maxWidth: "900px",
                        lineHeight: 1.2,
                        marginBottom: "24px",
                    }}
                >
                    Remote Job Marketplace for Filipino Talent
                </div>

                {/* Subtext */}
                <div
                    style={{
                        fontSize: "22px",
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                        maxWidth: "700px",
                        lineHeight: 1.4,
                    }}
                >
                    Connect with top-tier companies hiring remote professionals worldwide
                </div>

                {/* Bottom tag */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "40px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "999px",
                        padding: "10px 24px",
                    }}
                >
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px", fontWeight: "600" }}>
                        teamoraph.selleruniverse.com
                    </span>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
