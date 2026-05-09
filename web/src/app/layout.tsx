import type { Metadata } from "next";
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";

import { Web3Provider } from "@/components/providers/Web3Provider";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteName = "Nexus RWA";
const description =
  "Institutional-grade RWA analytics: yield, TVL, risk and holders. Powered by X402 Protocol on Base for AI agents and developers.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description,
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
   >
      <body className="min-h-full flex flex-col font-sans">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
