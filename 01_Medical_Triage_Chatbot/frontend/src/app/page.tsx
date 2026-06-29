import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/sections/HeroSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import DemoSection from '@/components/sections/DemoSection'
import FAQSection from '@/components/sections/FAQSection'

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DemoSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  )
}