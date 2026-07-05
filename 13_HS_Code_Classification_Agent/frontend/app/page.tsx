import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ClassifierTool from "@/components/ClassifierTool";
import UnderTheHood from "@/components/UnderTheHood";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <ClassifierTool />
      <UnderTheHood />
      <Footer />
    </main>
  );
}