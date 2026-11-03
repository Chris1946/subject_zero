import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#0a0b0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark font-mono h-full">
      <body className="min-h-[100dvh] flex flex-col font-mono bg-background text-text antialiased selection:bg-cold-blue selection:text-background">
        {children}
      </body>
    </html>
  );
}
