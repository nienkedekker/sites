import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import Navigation from "@/components/navigation";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "what.",
  description: "what!!!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body className="bg-background text-foreground text-sm/7">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col justify-between">
            <Navigation />
            <main
              id="main-content"
              className="flex-grow mx-auto container py-12"
              role="main"
            >
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
