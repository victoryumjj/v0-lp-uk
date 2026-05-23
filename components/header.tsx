"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, ShoppingBag, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Shop", href: "/products" },
  { name: "Wall Panels", href: "/products?category=wall-panels" },
  { name: "Lighting", href: "/products?category=lighting" },
  { name: "Decor", href: "/products?category=decor" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function Header() {
  const { totalItems, items } = useCart()
  const [open, setOpen] = useState(false)
  
  // Determine cart URL based on currency of items
  const hasUKItems = items.some((item) => item.product.currency === "GBP")
  const cartUrl = hasUKItems ? "/cart-uk" : "/cart"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/50 bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-background">
            <div className="flex items-center justify-between pb-6">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="font-serif text-2xl tracking-widest text-foreground"
              >
                SLATURA WOOD
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg text-foreground/80 transition-colors hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center font-serif text-xl font-medium tracking-[0.2em] text-foreground transition-opacity hover:opacity-80 sm:text-2xl lg:text-2xl">
          SLATURA WOOD
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-10 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-[13px] font-medium uppercase tracking-wider text-foreground/60 transition-colors duration-200 hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Cart */}
        <Link href={cartUrl} className="relative">
          <Button variant="ghost" size="icon">
            <ShoppingBag className="h-5 w-5" />
            <span className="sr-only">Cart</span>
          </Button>
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
              {totalItems}
            </span>
          )}
        </Link>
      </nav>
    </header>
  )
}
