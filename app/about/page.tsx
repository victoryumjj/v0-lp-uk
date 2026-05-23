import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const values = [
  {
    title: "Craftsmanship",
    description:
      "Every piece in our collection is crafted with meticulous attention to detail, using time-honoured techniques passed down through generations.",
  },
  {
    title: "Sustainability",
    description:
      "We source our materials responsibly, work with FSC-certified suppliers, and design products that stand the test of time - reducing waste through longevity.",
  },
  {
    title: "Timeless Design",
    description:
      "We believe in design that transcends trends. Our pieces are created to become cherished elements of your interior for years to come.",
  },
]

const team = [
  {
    name: "Lena Bergstrom",
    role: "Founder & Creative Director",
    image: "/professional-scandinavian-blonde-woman-founder-por.jpg",
  },
  {
    name: "Anders Nilsson",
    role: "Production Manager",
    image: "/professional-scandinavian-man-production-manager-p.jpg",
  },
  {
    name: "Sofia Lindqvist",
    role: "Lead Designer",
    image: "/professional-scandinavian-brunette-woman-designer-.jpg",
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl text-balance">
              Design That Lives With You
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              SLATURA WOOD was founded in Copenhagen in 2019 with a simple mission: to bring the warmth and authenticity
              of premium wood craftsmanship into modern homes across Europe.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-[4/5] overflow-hidden">
              <Image
                src="/woodworking-workshop-craftsman-working-on-wood-sla.jpg"
                alt="SLATURA WOOD workshop with craftsman working on wood panels"
                width={600}
                height={750}
                className="w-full h-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Our Story</span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl">Born From a Love of Natural Materials</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  Our founder, Lena Bergstrom, grew up surrounded by the forests of Sweden. Her grandfather was
                  a carpenter and taught her that wood has a soul - every grain tells a story, every knot holds character.
                </p>
                <p>
                  After years of working in industrial furniture production, Lena felt disconnected from the
                  materials she loved. In 2019, she returned to her roots, partnering with small workshops across
                  Scandinavia to create a collection that honours traditional craftsmanship whilst meeting the needs of contemporary living.
                </p>
                <p>
                  Today, SLATURA WOOD works with over 20 artisan workshops, from the oak forests of Denmark to the
                  ceramic studios of Portugal. Every product we offer has been touched by human hands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="sustainability" className="bg-secondary py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">What We Stand For</h2>
            <p className="mt-4 text-muted-foreground">
              Our values guide every decision, from the materials we choose to the partners we work with.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <div key={index} className="bg-background p-8">
                <h3 className="font-serif text-xl">{value.title}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="careers" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">The People Behind SLATURA WOOD</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A passionate team of designers, craftspeople and dreamers dedicated to bringing beautiful design into
              your home.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto aspect-square w-48 overflow-hidden rounded-full bg-secondary">
                  <Image
                    src={member.image || "/placeholder.svg"}
                    alt={member.name}
                    width={192}
                    height={192}
                    className="w-full h-full object-cover"
                    sizes="192px"
                  />
                </div>
                <h3 className="mt-6 font-serif text-lg">{member.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">Ready to Transform Your Space?</h2>
            <p className="mt-4 text-muted-foreground">
              Explore our collection of premium wood slat panels and curated interior decor for the perfect addition to your
              home.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/products">
                View Collection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
