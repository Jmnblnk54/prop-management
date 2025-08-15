import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "../components/ui/Footer"; // ⬅️ new

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Domatia | Property Management",
  description: "Modern property management for landlords and tenants. Domatia makes rent, maintenance, and communication simple.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
