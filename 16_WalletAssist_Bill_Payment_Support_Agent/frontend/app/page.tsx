import ApiKeyModal from "@/components/ApiKeyModal";
import BentoFeatures from "@/components/BentoFeatures";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BentoFeatures />
        <HowItWorks />
        <Faq />
      </main>
      <Footer />
      <ApiKeyModal />
    </>
  );
}