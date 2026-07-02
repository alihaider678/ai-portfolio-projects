import type { Metadata } from "next";
import { Space_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";
import { ApiKeysProvider } from "@/context/ApiKeysContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedAI Nexus — Multimodal Medical Reference Agent",
  description:
    "AI-powered medical reference agent. Read handwritten prescriptions, check drug interactions, query visual knowledge bases — all delivered as spoken audio.",
  keywords: ["medical AI", "prescription reader", "drug interaction", "RAG", "multimodal", "GPT-4o"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmMono.variable}`}
    >
      <body className="min-h-full antialiased font-space">
        <ThemeProvider>
          <ApiKeysProvider>{children}</ApiKeysProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}