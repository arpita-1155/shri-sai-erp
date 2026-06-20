import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shri Sai ERP",
  description: "Enterprise Resource Planning for Shri Sai & Bharamchetnya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Added Sonner Toaster for global notifications with rich colors */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}