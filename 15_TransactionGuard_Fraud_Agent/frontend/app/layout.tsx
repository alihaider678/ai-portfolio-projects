import type { Metadata, Viewport } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ApiKeyProvider } from "@/components/ApiKeyProvider";
import { LiveSocketProvider } from "@/components/LiveSocketProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const display = Manrope({
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
  title: "TransactionGuard — Adaptive Fraud Investigation Agent",
  description:
    "A LangGraph agent that adaptively investigates wallet transactions — choosing which checks to run and when it has enough evidence, retrieving precedent from episodic memory, and producing an explainable risk verdict.",
};

export const viewport: Viewport = { colorScheme: "dark light", themeColor: "#070b14" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${display.variable} ${inter.variable} ${mono.variable}`}>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ApiKeyProvider>
            <LiveSocketProvider>{children}</LiveSocketProvider>
          </ApiKeyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}