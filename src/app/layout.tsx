import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { XWidgetsLoader } from "@/components/x-widgets-loader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Insight JP | AIの今を、深く、分かりやすく",
  description:
    "Xの公式投稿、AIニュース、一般ユーザーの反応をまとめるAIメディアMVP。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <XWidgetsLoader />
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
