import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamoraph.selleruniverse.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TeamoraPH — Remote Job Marketplace for Filipino Talent",
    template: "%s | TeamoraPH",
  },
  description:
    "Find top remote jobs and elite Filipino talent. TeamoraPH connects remote-ready candidates with forward-thinking companies worldwide.",
  keywords: [
    "remote jobs Philippines",
    "work from home Philippines",
    "Filipino remote talent",
    "online jobs Philippines",
    "remote hiring",
    "remote work",
    "job marketplace Philippines",
  ],
  authors: [{ name: "TeamoraPH", url: siteUrl }],
  creator: "TeamoraPH",
  publisher: "TeamoraPH",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "TeamoraPH",
    title: "TeamoraPH — Remote Job Marketplace for Filipino Talent",
    description:
      "Find top remote jobs and elite Filipino talent. TeamoraPH connects remote-ready candidates with forward-thinking companies worldwide.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TeamoraPH — Remote Job Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TeamoraPH — Remote Job Marketplace for Filipino Talent",
    description:
      "Find top remote jobs and elite Filipino talent on TeamoraPH.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
