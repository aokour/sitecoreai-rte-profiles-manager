import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { MarketplaceProvider } from "@/components/providers/marketplace";
import { Toaster } from "@/components/ui/sonner";
import { AeLogoCorner } from "@/components/AeLogoCorner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "SitecoreAI RTE Profiles Manager",
  description: "Manage Editor Profiles and site assignments for XM Cloud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${libreFranklin.variable} antialiased`}
      >
        <MarketplaceProvider>
          {children}
          <Toaster />
        </MarketplaceProvider>
        <AeLogoCorner />
      </body>
    </html>
  );
}
