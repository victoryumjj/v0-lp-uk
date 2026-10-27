import Image from "next/image"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sophie M.",
    location: "London, UK",
    rating: 5,
    text: "The oak panels have completely transformed our living room. The quality is exceptional and the installation was surprisingly simple.",
  },
  {
    name: "James L.",
    location: "Manchester, UK",
    rating: 5,
    text: "Beautiful craftsmanship. I ordered the acoustic panels for my home studio and the sound difference is remarkable. Plus, they look stunning.",
  },
  {
    name: "Emma K.",
    location: "Edinburgh, UK",
    rating: 5,
    text: "SLATURA WOOD has become my go-to for interior decor. Every piece I have purchased feels thoughtfully designed and built to last.",
  },
]

export function Testimonials() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/trend-japandi-interior-natural-wood.jpg"
          alt=""
          fill
          className="object-cover blur-sm"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/50" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent">Testimonials</span>
          <h2 className="font-serif text-4xl font-medium sm:text-5xl lg:text-6xl">What Our Customers Say</h2>
          <p className="mx-auto mt-5 max-w-2xl text-foreground/80">
            Join thousands of satisfied customers who have transformed their homes with SLATURA WOOD.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="glass flex flex-col rounded-[32px] p-8 shadow-[0_8px_30px_rgb(51_37_28/0.08)]">
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#B07A4A] text-[#B07A4A]" />
                ))}
              </div>
              <p className="mt-5 flex-1 font-serif text-2xl font-medium italic leading-snug text-foreground">{`"${testimonial.text}"`}</p>
              <div className="mt-8 border-t border-white/70 pt-5">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
