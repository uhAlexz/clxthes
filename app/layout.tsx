import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ServiceWorkerRegistrar } from "@/components/ui/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "clxthes",
  description:
    "Discover Roblox clothing groups. Build a unified catalog feed from any community.",
  // PWA / mobile meta
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "clxthes",
  },
  formatDetection: {
    // Prevent iOS from auto-linking phone numbers in item names / descriptions
    telephone: false,
  },
};

// `viewport` must be a separate export in Next.js 16 — mixing it into
// `metadata` was deprecated and now raises a build warning.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` lets the app extend under the iPhone notch / Dynamic Island
  // so the dark background fills the full screen in standalone mode.
  viewportFit: "cover",
  themeColor: "#070707",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Apple touch icon — used for the home screen shortcut on iOS */}
        {/* Replace /icon-192.png with your actual icon once generated */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        {children}
        <Toaster
          position="bottom-left"
          toastOptions={{
            className:
              "font-sans text-xs tracking-wide border-border rounded-none bg-card text-foreground shadow-none",
          }}
        />
        {/* Registers /sw.js — renderless, runs once on app boot */}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
