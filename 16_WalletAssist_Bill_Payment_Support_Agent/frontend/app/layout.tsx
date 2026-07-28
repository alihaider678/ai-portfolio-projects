import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ApiKeyProvider } from "@/components/ApiKeyProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WalletAssist — Bill Payment & Wallet Support Agent",
  description:
    "A RAG + tool-calling agent that answers wallet, bill-payment, and transaction-status questions in plain English — grounded in real product knowledge, with account-specific lookups instead of generic answers.",
};

export const viewport: Viewport = { colorScheme: "dark light", themeColor: "#0b0a16" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${display.variable} ${inter.variable} ${mono.variable}`}>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ApiKeyProvider>{children}</ApiKeyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}