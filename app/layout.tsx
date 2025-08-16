import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Footer from "@/components/ui/Footer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Domatia | Property Management",
  description:
    "Modern property management for landlords and tenants. Domatia makes rent, maintenance, and communication simple.",
  metadataBase: new URL("https://www.domatia.app"),
  openGraph: {
    title: "Domatia | Property Management",
    description: "Simplify rent, maintenance, and tenant communication.",
    url: "https://www.domatia.app",
    siteName: "Domatia",
    images: [
      {
        url: "/og-image.jpg",
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
    site: "@DomatiaApp",
    title: "Domatia | Property Management",
    description: "Simplify rent, maintenance, and tenant communication.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "your-google-site-verification-code",
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
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen flex flex-col">
            <div className="flex-grow">{children}</div>
            <Footer />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
