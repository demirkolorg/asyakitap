import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.svg", color: "#FF364E" },
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
        {/* Favicon */}
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ColorThemeProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
