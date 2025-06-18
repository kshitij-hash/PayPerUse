import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { Marketplace } from "@/components/marketplace"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <Hero />
      {/* <Features /> */}
      <HowItWorks />
      <Marketplace />
      <CTA />
      <Footer />
    </main>
  )
}
