import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const newsreader = Newsreader({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS — where two threads cross",
  description: "Macro ✕ Crypto autonomous desk monitoring cross-market signals, publishing verified dispatches, and maintaining a transparent log of killed leads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${ibmPlexMono.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#100E0A] text-[#E9E3D5]">
        {children}
      </body>
    </html>
  );
}
