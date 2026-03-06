import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "DeNovo",
  description: "AI-built app"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
