"use client"

import { useState } from "react"
import Image from "next/image"
import { ShoppingCart, Check, Star, Truck, RotateCcw, Shield, ChevronDown, ChevronUp } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { ProductGallery } from "@/components/product-gallery"
import type { Product } from "@/lib/products"

const SIZES = [
  { id: "21x30", label: "21x30 CM", price: 0 },
  { id: "30x40", label: "30x40 CM", price: 10 },
  { id: "40x60", label: "40x60 CM", price: 20 },
  { id: "50x70", label: "50x70 CM", price: 35 },
  { id: "70x100", label: "70x100 CM", price: 60 },
  { id: "100x150", label: "100x150 CM", price: 105 },
]

const FRAMES = [
  {
    id: "moldura-filete",
    label: "1. Moldure Filet",
    desc: "Fine à l'avant et profonde sur le côté",
    priceExtra: 0,
  },
  {
    id: "moldura-premium-vidro",
    label: "2. Moldure Premium",
    desc: "Avec Verre",
    priceExtra: 15,
  },
  {
    id: "moldura-premium-sem-vidro",
    label: "3. Moldure Premium",
    desc: "Sans Verre",
    priceExtra: 10,
  },
  {
    id: "canvas",
    label: "4. Canvas",
    desc: "Avec Cadre",
    priceExtra: 20,
  },
  {
    id: "papel-fotografico",
    label: "5. Papier Photographique",
    desc: "Sans Cadre",
    priceExtra: 0,
  },
  {
    id: "placa-decorativa",
    label: "6. Plaque Décorative",
    desc: "",
    priceExtra: 25,
  },
]

const COLORS = [
  { id: "noir", name: "Noir", hex: "#1a1a1a" },
  { id: "blanc", name: "Blanc", hex: "#f5f5f5", border: true },
  { id: "naturel", name: "Naturel", hex: "#D4B896" },
  { id: "freijo", name: "Freijó", hex: "#8B6343" },
  { id: "noyer", name: "Noyer", hex: "#3E2010" },
]

const FRAME_INFO = [
  {
    id: "papel-fotografico",
    title: "Papier Photographique",
    subtitle: "Poster imprimé en haute définition",
    desc: "Avec des couleurs vives et <strong>imprimés sur papier de haute grammage</strong>, nos posters sont l'option idéale pour ceux qui ont déjà un cadre ou souhaitent le personnaliser dans un atelier local.",
    bullets: [
      "Impression artistique haute définition sur papier photo 240g",
      "Soigneusement emballé et envoyé en tube postal résistant",
      "Impression avec encre écologique et non toxique",
    ],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_iflkykiflkykiflk-14ui5eCJO8pRc8M5c39UDE3wbYdvWl.png",
  },
  {
    id: "moldura-premium-vidro",
    title: "Moldure Premium",
    subtitle: "Finition haut de gamme et sophistiquée",
    desc: "Connue comme moldure type « boîte », la Moldure Premium possède une structure <strong>plus robuste et une présence marquante</strong>, pouvant être choisie avec ou sans verre. <br/><br/>Note: La mesure finale du tableau est la somme de l'art avec la moldure. Ex: art 50×70 cm → tableau final approx. 53×73 cm.",
    bullets: [
      "Bord de 1,5 cm",
      "Profondeur de 3 cm",
      "Verre spécial pour tableaux de 0,2 cm d'épaisseur",
      "100% bois de Pin de reboisement et impression avec encre écologique",
    ],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_49z2p49z2p49z2p4.png-7tVfBDjzuQoxvZHIySLVUgg9vuLsF1.jpeg",
  },
  {
    id: "moldura-filete",
    title: "Moldure Filet",
    subtitle: "Fine à l'avant et profonde sur le côté",
    desc: "Avec un profil fin à l'avant et une plus grande profondeur latérale, la Moldure Filet combine légèreté et présence. Son <strong>design minimaliste valorise l'art</strong>, le maintenant aligné avec la moldure pour un visuel sophistiqué.<br/><br/>Note: La mesure finale du tableau est la somme de l'art avec la moldure. Ex: art 50×70 cm → tableau final approx. 51×71 cm.",
    bullets: [
      "Bord de 0,4 cm",
      "Profondeur de 3 cm",
      "Impression dernière génération, résistante et ne décolore pas",
      "100% bois de Pin de reboisement et impression avec encre écologique",
    ],
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_ho4ec5ho4ec5ho4e-2UOOEE3fBhit8jtumSwUCqnRq9qgrb.png",
  },
]

const QUALITY_CARDS = [
  {
    title: "Nos tableaux sont faits à la main.",
    desc: "Ici, chaque tableau passe entre des mains talentueuses, qui garantissent une finition impeccable.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/17_39_26_187_lr01427-filete-preta%20%281%29-9tbzZKTDsBeo3Zh5UCm6vWsOFY4A2q.webp",
  },
  {
    title: "Votre tableau, votre maison, votre style.",
    desc: "Nous créons chaque pièce avec soin, pour que vous ressentiez cette attention à chaque détail.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11_50_13_758_11_2_1_119_lr01427ambiente03%20%282%29-rKVz9Zs6yc0iLmDktTFO4xdy6Wk4Rh.webp",
  },
  {
    title: "Pièces avec sceau de qualité.",
    desc: "C'est ainsi que nous garantissons que chaque pièce a été réalisée selon nos standards d'excellence.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/11_50_05_829_11_2_1_169_lr01427destaque-3rTBVWdA4H0XQmcV9lYEdKBX5Mv0eo.webp",
  },
]

interface Props {
  product: Product
}

export function TableauMadridPage({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState(SIZES[0])
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0])
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [added, setAdded] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showFrameInfo, setShowFrameInfo] = useState(false)
  const { addItem } = useCart()

  const totalPrice = product.price + selectedSize.price + selectedFrame.priceExtra

  const handleAddToCart = () => {
    const variantProduct = {
      ...product,
      name: `${product.name} - ${selectedSize.label} - ${selectedFrame.label} - ${selectedColor.name}`,
      price: totalPrice,
    }
    addItem(variantProduct as any, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Gallery */}
        <ProductGallery images={product.images} productName={product.name} video={product.video} videoThumbnail={product.videoThumbnail} />

        {/* Header */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(127 avis)</span>
          </div>
          <h1 className="text-xl font-bold text-foreground leading-snug text-balance">
            {product.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              €{totalPrice.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-sm line-through text-muted-foreground">
                €{(product.originalPrice + selectedSize.price + selectedFrame.priceExtra).toFixed(2)}
              </span>
            )}
            {product.onSale && (
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded">
                PROMO
              </span>
            )}
          </div>
        </div>

        <hr className="my-4 border-border" />

        {/* 1. Size selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">1. Taille</span>
            <button
              onClick={() => setShowSizeGuide(!showSizeGuide)}
              className="text-xs text-primary underline flex items-center gap-1"
            >
              Guide des tailles {showSizeGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          {showSizeGuide && (
            <div className="mb-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Guide des tailles :</p>
              <p>21x30 cm : Format A4, idéal pour petits espaces</p>
              <p>30x40 cm : Format A3, populaire pour bureaux</p>
              <p>40x60 cm : Grand format, impact visuel fort</p>
              <p>50x70 cm : Bestseller, parfait pour salon</p>
              <p>70x100 cm : Très grand, statement wall</p>
              <p>100x150 cm : Format XXL, impact maximal</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  selectedSize.id === size.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                }`}
              >
                {size.label}
                {size.price > 0 && (
                  <span className="ml-1 text-muted-foreground">(+€{size.price})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <hr className="my-4 border-border" />

        {/* 2. Frame selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">2. Finition</span>
            <button
              onClick={() => setShowFrameInfo(!showFrameInfo)}
              className="text-xs text-primary underline flex items-center gap-1"
            >
              Découvrir nos finitions {showFrameInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FRAMES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame)}
                className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                  selectedFrame.id === frame.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                }`}
              >
                <span className="text-xs font-semibold block">{frame.label}</span>
                {frame.desc && <span className={`text-xs block ${selectedFrame.id === frame.id ? "text-background/70" : "text-muted-foreground"}`}>{frame.desc}</span>}
                {frame.priceExtra > 0 && (
                  <span className={`text-xs font-medium ${selectedFrame.id === frame.id ? "text-background/80" : "text-primary"}`}>+€{frame.priceExtra}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <hr className="my-4 border-border" />

        {/* 3. Color selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">3. Couleur</span>
            <span className="text-sm text-muted-foreground">{selectedColor.name}</span>
          </div>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color)}
                title={color.name}
                className={`w-10 h-10 rounded-lg transition-all ring-offset-2 ${
                  selectedColor.id === color.id
                    ? "ring-2 ring-foreground scale-110"
                    : "ring-1 ring-border hover:ring-foreground/50"
                }`}
                style={{
                  backgroundColor: color.hex,
                  border: (color as any).border ? "1px solid #e5e7eb" : undefined,
                }}
                aria-label={color.name}
              />
            ))}
          </div>
        </div>

        <hr className="my-4 border-border" />

        {/* Add to cart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground text-lg">€{totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-4 rounded-full font-bold text-base transition-all hover:bg-accent/90 active:scale-[0.98]"
          >
            {added ? (
              <>
                <Check className="w-5 h-5" />
                Ajouté au panier !
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { icon: Truck, label: "Livraison gratuite" },
              { icon: RotateCcw, label: "Retours 30 jours" },
              { icon: Shield, label: "Paiement sécurisé" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Frame info sections */}
        <div className="mt-8 space-y-10">
          {FRAME_INFO.map((info) => (
            <div key={info.id}>
              <div className="mb-3">
                <h3 className="font-bold text-foreground text-base">{info.title}</h3>
                <p className="text-sm text-muted-foreground">{info.subtitle}</p>
                <hr className="mt-2 border-border" />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <p
                    className="text-sm text-foreground/80 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: info.desc }}
                  />
                </div>
                {info.image && (
                  <div className="sm:w-64 rounded-xl overflow-hidden">
                    <Image
                      src={info.image}
                      alt={info.title}
                      width={600}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
              </div>
              <ul className="mt-3 space-y-1">
                {info.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-green-600 font-bold mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quality section */}
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {QUALITY_CARDS.map((card) => (
              <div key={card.title} className="rounded-xl overflow-hidden border border-border">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={400}
                  height={250}
                  className="w-full h-36 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {card.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
