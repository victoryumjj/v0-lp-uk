"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

const FAQS = [
  {
    q: "Does it really stick to curved walls or columns?",
    a: "Yes, that's its main design feature. The 5mm acoustic felt backing allows flexibility down to a 20cm radius. Customers have installed it on 18cm diameter columns and arches. Photos available in the reviews below.",
  },
  {
    q: "What do I need to install it? Do I need a tradesman?",
    a: "A utility knife and a ruler. That's it. The adhesive is pre-applied and repositionable for 48 hours. 94% of our customers install it themselves, with no prior renovation experience. Average time: 25 minutes per panel.",
  },
  {
    q: "What if I order too many panels?",
    a: "Returns are free within 30 days for uncut panels. Our calculator includes a 10% margin for waste. You can also order the exact minimum and come back to top up if needed.",
  },
  {
    q: "Is it real wood or a plastic coating?",
    a: "Real wood. The slats are solid MDF with genuine wood finish. You can sand and stain it like any wood. No PVC film, no paper veneer.",
  },
  {
    q: "Will it hold up in damp rooms (bathroom, kitchen)?",
    a: "Yes, for normal use. Several customers have installed it in bathrooms and above worktops. Just avoid direct running water or steam exposure.",
  },
  {
    q: "When will I receive my order?",
    a: "Dispatch within 24-48 hours, delivery in 5-8 working days to mainland UK. You'll receive a tracking email as soon as it ships. Delivery is free on all orders.",
  },
]

export function FAQSectionUK() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="my-12 sm:my-16">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>

      <div className="divide-y divide-[#E8DDD4]">
        {FAQS.map((faq, index) => (
          <div key={index} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="font-medium text-foreground text-sm sm:text-base">{faq.q}</span>
              <span
                className={`w-6 h-6 rounded-full border border-[#E8DDD4] flex items-center justify-center flex-shrink-0 text-primary transition-transform duration-200 ${
                  openIndex === index ? "rotate-45 border-primary" : ""
                }`}
              >
                <Plus className="w-4 h-4" />
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: openIndex === index ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
