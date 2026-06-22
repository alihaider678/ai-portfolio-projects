import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/sections/HeroSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import FAQSection from '@/components/sections/FAQSection'
import DemoSection from '@/components/sections/DemoSection'

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <FAQSection />
        <DemoSection />
      </main>
      <Footer />
    </>
  )
}
