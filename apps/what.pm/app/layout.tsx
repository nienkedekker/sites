import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Geist, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import { ReactNode } from "react";
import Navigation from "@/components/layouts/navigation";
import Footer from "@/components/layouts/footer";
import { Metadata, Viewport } from "next";
import { AuthProvider } from "@/providers/auth-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-family",
});
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-serif-family",
});
const geist = Geist({
  weight: "500",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-family",
});
const geistMono = Geist_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono-family",
});

// Production shares should point at what.pm, not the protected deployment URL
const host =
  process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL;
const defaultUrl = host ? `https://${host}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: { default: "what. · what.pm", template: "%s · what.pm" },
  description:
    "what!!! every book, movie and show I’ve read or watched since 2007.",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "what. · what.pm" }],
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <div className="flex min-h-screen flex-col">
              <Navigation />
              <main
                id="main-content"
                className="mx-auto w-full max-w-6xl flex-grow px-4 pt-16 sm:pt-24"
              >
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
