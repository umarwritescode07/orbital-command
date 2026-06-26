import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/auth-context";
import "./globals.css";

export const metadata = {
  title: "ORBITAL COMMAND - Aerospace Operations Control",
  description: "Enterprise-grade real-time satellite operations platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark grid-lines">
      <body className="antialiased min-h-screen text-slate-200 bg-background font-sans select-none overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
