import { HeroSection } from "@/components/hero-section"
import { ChristmasHomeSection } from "@/components/christmas/christmas-home-section"
import { CategoriesSection } from "@/components/categories-section"
import { FeaturedProducts } from "@/components/featured-products"
import { TrendsSection } from "@/components/trends-section"
import { Testimonials } from "@/components/testimonials"
import { Newsletter } from "@/components/newsletter"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ChristmasHomeSection />
      <CategoriesSection />
      <FeaturedProducts />
      <TrendsSection />
      <Testimonials />
      <Newsletter />
    </>
  )
}
