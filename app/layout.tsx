import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AsyaKitap - Kişisel Kütüphane",
  description: "Kitaplarını yönet, tortularını sakla. Kişisel kütüphane yönetimi ve okuma takibi.",
  keywords: ["kitap", "okuma", "kütüphane", "alıntı", "tortu", "okuma listesi"],
  authors: [{ name: "AsyaKitap" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/asyakitap.png", color: "#7c3aed" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AsyaKitap",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://asyakitap.vercel.app",
    title: "AsyaKitap - Kişisel Kütüphane",
    description: "Kitaplarını yönet, tortularını sakla. 367 kitaplık hazır okuma listeleri.",
    siteName: "AsyaKitap",
  },
  twitter: {
    card: "summary_large_image",
    title: "AsyaKitap - Kişisel Kütüphane",
    description: "Kitaplarını yönet, tortularını sakla. 367 kitaplık hazır okuma listeleri.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Dark mode favicon support */}
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-32x32-dark.png"
          type="image/png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
          <PWAInstallPrompt />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
