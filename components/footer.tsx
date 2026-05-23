import Link from "next/link"
import { Instagram, Facebook, Twitter } from "lucide-react"

const footerLinks = {
  shop: [
    { name: "All Products", href: "/products" },
    { name: "Wall Panels", href: "/products?category=wall-panels" },
    { name: "Lighting", href: "/products?category=lighting" },
    { name: "Mirrors", href: "/products?category=mirrors" },
    { name: "Decor", href: "/products?category=decor" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Sustainability", href: "/about#sustainability" },
    { name: "Careers", href: "/about#careers" },
  ],
  support: [
    { name: "Delivery", href: "/contact#shipping" },
    { name: "Returns", href: "/contact#returns" },
    { name: "FAQ", href: "/contact#faq" },
    { name: "Care Guide", href: "/contact#care" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="font-serif text-2xl font-medium tracking-[0.2em] text-foreground">
              SLATURA WOOD
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Premium wood slat panels and curated interior decor. We believe in quality craftsmanship, sustainable materials and timeless design that elevates every space.
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Shop</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Company</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-foreground">Support</h3>
            <ul className="mt-5 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-10 sm:flex-row">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SLATURA WOOD. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
