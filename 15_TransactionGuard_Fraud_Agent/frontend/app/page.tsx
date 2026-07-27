import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import InvestigationConsole from "@/components/InvestigationConsole";
import LiveFeed from "@/components/LiveFeed";
import StatsPanel from "@/components/StatsPanel";
import PrecedentExplorer from "@/components/PrecedentExplorer";
import HowItWorks from "@/components/HowItWorks";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import ApiKeyModal from "@/components/ApiKeyModal";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <InvestigationConsole />
        <LiveFeed />
        <StatsPanel />
        <PrecedentExplorer />
        <HowItWorks />
        <Faq />
      </main>
      <Footer />
      <ApiKeyModal />
    </>
  );
}