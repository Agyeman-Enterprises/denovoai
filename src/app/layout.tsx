import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeNovo — The AI App Factory",
  description: "Describe an app. Get a deployed product. DeNovo turns your ideas into live web applications in minutes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://denovoai.co"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Suspense fallback={null}><AnalyticsProvider /></Suspense>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
