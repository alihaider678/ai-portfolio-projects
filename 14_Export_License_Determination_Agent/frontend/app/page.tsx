import { ApiKeyProvider } from "@/components/ApiKeyProvider";
import ApiKeyModal from "@/components/ApiKeyModal";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import Playground from "@/components/Playground";
import HowItWorks from "@/components/HowItWorks";
import DemoSection from "@/components/DemoSection";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <ApiKeyProvider>
      <main className="relative">
        <Nav />
        <Hero />
        <ProblemSection />
        <Playground />
        <HowItWorks />
        <DemoSection />
        <Faq />
        <Footer />
      </main>
      <ApiKeyModal />
    </ApiKeyProvider>
  );
}