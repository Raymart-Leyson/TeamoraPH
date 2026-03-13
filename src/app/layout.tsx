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
    "Find top remote jobs and hire elite Filipino talent. TeamoraPH is the Philippines' #1 remote job marketplace connecting remote-ready candidates with forward-thinking companies worldwide.",
  keywords: [
    // Job seekers – primary
    "remote jobs Philippines",
    "online jobs Philippines",
    "work from home Philippines",
    "work from home jobs for Filipinos",
    "remote jobs for Filipinos",
    "online jobs for Filipinos",
    "Filipino remote jobs",
    "home based jobs Philippines",
    "legitimate online jobs Philippines",
    "high paying online jobs Philippines",
    "part time online jobs Philippines",
    "full time remote jobs Philippines",
    "remote work no experience Philippines",
    "entry level remote jobs Philippines",
    // Job seeker – roles
    "virtual assistant jobs Philippines",
    "customer service jobs remote Philippines",
    "data entry jobs Philippines",
    "social media manager jobs Philippines",
    "graphic designer jobs remote Philippines",
    "web developer jobs remote Philippines",
    "content writer jobs Philippines",
    "SEO specialist jobs Philippines",
    "bookkeeping jobs remote Philippines",
    "project manager remote jobs Philippines",
    // Employers – international & local
    "hire Filipino talent",
    "hire Filipino remote workers",
    "hire Filipino virtual assistant",
    "hire Filipino developer",
    "hire Filipino staff online",
    "hire remote staff Philippines",
    "outsource to Philippines",
    "Philippine outsourcing",
    "BPO Philippines",
    "Filipino virtual assistant",
    "Filipino freelancers",
    "remote workers Philippines",
    "offshore staff Philippines",
    "dedicated remote staff Philippines",
    // General marketplace
    "job marketplace Philippines",
    "Filipino remote talent",
    "remote hiring Philippines",
    "remote work Philippines",
    "TeamoraPH",
    "Teamora jobs",
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
      "Find top remote jobs and hire elite Filipino talent. TeamoraPH is the Philippines' #1 remote job marketplace.",
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
      "Find top remote jobs and hire elite Filipino talent on TeamoraPH — the Philippines' #1 remote job marketplace.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  verification: {
    google: "AKxEp0t6SeWmvIoMJl9tpcbpA75z0_q7SgngCzeqK84",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PH">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
