import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Domatia | Property Management",
  description: "Modern property management for landlords and tenants. Domatia makes rent, maintenance, and communication simple.",
  metadataBase: new URL("https://www.domatia.app"), // Change to your real domain
  openGraph: {
    title: "Domatia | Property Management",
    description: "Simplify rent, maintenance, and tenant communication.",
    url: "https://www.domatia.app", // Change this to your actual domain
    siteName: "Domatia",
    images: [
      {
        url: "/og-image.jpg", // Save your social image in /public
        width: 1200,
        height: 630,
        alt: "Domatia dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@DomatiaApp", // update once you have a handle
    title: "Domatia | Property Management",
    description: "Simplify rent, maintenance, and tenant communication.",
    images: ["/og-image.jpg"], // Should be same as Open Graph
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "your-google-site-verification-code", // Replace with real code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Extra tags just in case */}
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
