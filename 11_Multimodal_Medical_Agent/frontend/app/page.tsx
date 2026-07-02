import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MainApp from "@/components/MainApp";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <MainApp />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}