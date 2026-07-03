import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ScreeningTool from "@/components/ScreeningTool";
import UnderTheHood from "@/components/UnderTheHood";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <ScreeningTool />
      <UnderTheHood />
      <Footer />
    </main>
  );
}