import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font — zero runtime CDN requests, no captive-portal risk
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--loaded-font-pixel",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--loaded-font-mono",
});

export const metadata: Metadata = {
  title: "SUBJECT ZERO",
  description: "Holloway Research Facility Investigation Terminal",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0103",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark h-full ${pressStart2P.variable} ${vt323.variable}`}>
      <body className="min-h-[100dvh] flex flex-col bg-background text-text antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
