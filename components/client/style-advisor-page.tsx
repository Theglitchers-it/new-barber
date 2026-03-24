"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Upload,
  Sparkles,
  Wand2,
  Calendar,
  ChevronRight,
  X,
  Loader2,
  ImageIcon,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Curated style suggestions with Unsplash images
const STYLE_SUGGESTIONS = [
  {
    id: "modern-bob",
    name: "Bob Moderno",
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=500&fit=crop",
    category: "donna",
    description: "Taglio bob strutturato con punte texturizzate. Perfetto per visi ovali e a cuore.",
    difficulty: "Facile da mantenere",
    serviceId: null,
  },
  {
    id: "textured-crop",
    name: "Crop Texturizzato",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=500&fit=crop",
    category: "uomo",
    description: "Taglio corto con texture naturale e fade laterale. Look pulito e moderno.",
    difficulty: "Bassa manutenzione",
    serviceId: null,
  },
  {
    id: "balayage-miele",
    name: "Balayage Miele",
    image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=500&fit=crop",
    category: "donna",
    description: "Sfumature miele su base castana. Effetto naturale e luminoso.",
    difficulty: "Ritocco ogni 3-4 mesi",
    serviceId: null,
  },
  {
    id: "classic-fade",
    name: "Fade Classico",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=500&fit=crop",
    category: "uomo",
    description: "Dissolvenza perfetta con lunghezza sopra. Il taglio più richiesto.",
    difficulty: "Ritocco ogni 3-4 settimane",
    serviceId: null,
  },
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=500&fit=crop",
    category: "donna",
    description: "Corto e audace. Esalta i lineamenti del viso e dona carattere.",
    difficulty: "Ritocco ogni 4-6 settimane",
    serviceId: null,
  },
  {
    id: "rame-vibrante",
    name: "Rosso Rame",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop",
    category: "donna",
    description: "Colore rame intenso e vibrante. Il trend del momento.",
    difficulty: "Ritocco mensile",
    serviceId: null,
  },
]

type Step = "upload" | "analyzing" | "results"

export function StyleAdvisorPage() {
  const [step, setStep] = useState<Step>("upload")
  const [selfie, setSelfie] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<"all" | "donna" | "uomo">("all")
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSelfie(reader.result as string)
      setStep("analyzing")
      // Simulate AI analysis
      setTimeout(() => setStep("results"), 2500)
    }
    reader.readAsDataURL(file)
  }

  const resetAdvisor = () => {
    setSelfie(null)
    setStep("upload")
    setSelectedStyle(null)
  }

  const filteredStyles = selectedCategory === "all"
    ? STYLE_SUGGESTIONS
    : STYLE_SUGGESTIONS.filter(s => s.category === selectedCategory)

  const activeStyle = STYLE_SUGGESTIONS.find(s => s.id === selectedStyle)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-heading font-bold">Style Advisor AI</h1>
      </div>

      {step === "upload" && (
        <>
          {/* Upload Card */}
          <Card className="overflow-hidden border-0">
            <div className="gradient-primary p-6 text-center text-white">
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-90" />
              <h2 className="text-lg font-heading font-bold">Scopri il tuo stile ideale</h2>
              <p className="text-sm opacity-80 mt-1">
                Carica un selfie e l'AI ti suggerira i look perfetti per te
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="h-20 flex-col gap-2 rounded-2xl"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs font-semibold">Scatta Selfie</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 flex-col gap-2 rounded-2xl"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs font-semibold">Carica Foto</span>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Or browse styles directly */}
          <div className="text-center py-2">
            <button
              onClick={() => setStep("results")}
              className="text-sm text-primary font-medium hover:underline"
            >
              Oppure esplora gli stili senza foto
            </button>
          </div>
        </>
      )}

      {step === "analyzing" && (
        <Card className="overflow-hidden">
          <CardContent className="p-8 text-center">
            {selfie && (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-primary/30">
                <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
              </div>
            )}
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="font-heading font-bold">Analisi in corso...</p>
            <p className="text-sm text-muted-foreground mt-1">
              L'AI sta analizzando la forma del viso e le caratteristiche
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {["Forma viso", "Tono pelle", "Tipo capelli"].map((label, i) => (
                <span
                  key={label}
                  className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "results" && (
        <>
          {/* Selfie preview + AI badge */}
          {selfie && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shrink-0">
                <img src={selfie} alt="Tu" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Stili consigliati per te</p>
                <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                  <Sparkles className="w-3 h-3" />
                  Analisi AI completata
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetAdvisor}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex gap-2">
            {(["all", "donna", "uomo"] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "gradient-primary text-white shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {cat === "all" ? "Tutti" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Style Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredStyles.map(style => (
              <Card
                key={style.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300",
                  selectedStyle === style.id ? "ring-2 ring-primary scale-[1.02]" : "hover:shadow-lg"
                )}
                onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs font-bold text-white">{style.name}</p>
                    <p className="text-[10px] text-white/70">{style.category === "donna" ? "Donna" : "Uomo"}</p>
                  </div>
                  {selfie && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/90 text-white text-[9px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {Math.floor(Math.random() * 15 + 85)}%
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Selected Style Detail */}
          {activeStyle && (
            <Card className="border-primary/30 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0">
                    <img src={activeStyle.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold">{activeStyle.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{activeStyle.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {activeStyle.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href="/prenotazioni/nuova">
                  <Button className="w-full gap-2 h-11 font-semibold rounded-xl">
                    <Calendar className="w-4 h-4" />
                    Prenota Questo Stile
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
