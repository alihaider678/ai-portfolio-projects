"use client";

import { useRef } from "react";
import HeroSection from "@/components/HeroSection";
import DemoSection from "@/components/DemoSection";
import TechStackSection from "@/components/TechStackSection";
import FAQSection from "@/components/FAQSection";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  const demoRef = useRef<HTMLDivElement>(null);

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[var(--page-bg)]">
      <HeroSection onStartAnalysis={scrollToDemo} />
      <DemoSection sectionRef={demoRef} />
      <TechStackSection />
      <FAQSection />
      <SiteFooter />
    </main>
  );
}