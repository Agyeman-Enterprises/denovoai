import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "DeNovo Studio",
  description: "Control panel for AI-built apps"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
