import type { Metadata } from "next";
import SessionProvider from "@/providers/session-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hive | SweetLease Admin",
  description: "Admin dashboard for SweetLease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
