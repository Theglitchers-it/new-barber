import { prisma } from "@/lib/prisma"
import { proxyImageUrl } from "@/lib/image-url"
import Link from "next/link"
import {
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Scissors,
  ArrowRight,
  ChevronDown,
  LogIn,
  UserPlus,
  ShoppingBag,
  CheckCircle2,
  Users,
  Heart,
  Zap,
  Instagram,
  Facebook,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { AnimatedCounter } from "@/components/landing/animated-counter"
import { Marquee } from "@/components/landing/marquee"
import { WhatsAppButton } from "@/components/landing/whatsapp-button"
import { BackToTop } from "@/components/landing/back-to-top"
import { ThemeToggle } from "@/components/landing/theme-toggle"
import { MobileNav } from "@/components/landing/mobile-nav"
import { FAQSection } from "@/components/landing/faq-section"
import { ParallaxHero } from "@/components/landing/parallax-hero"
import { BeforeAfterSlider } from "@/components/ui/before-after-slider"

export const revalidate = 60

export default async function LandingPage() {
  const [settings, popularServices, allServices, operators, reviews, products] =
    await Promise.all([
      prisma.businessSettings.findFirst({ where: { id: "default" } }),
      prisma.service.findMany({
        where: { active: true, popular: true },
        orderBy: { price: "desc" },
        take: 6,
      }),
      prisma.service.findMany({
        where: { active: true },
        select: { name: true },
      }),
      prisma.operator.findMany({
        where: { active: true },
        orderBy: { rating: "desc" },
        take: 4,
      }),
      prisma.review.findMany({
        where: { visible: true, rating: 5 },
        include: {
          user: { select: { name: true } },
          operator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { active: true, stock: { gt: 0 } },
        orderBy: { rating: "desc" },
        take: 4,
      }),
    ])

  const salonName = settings?.salonName || "SalonPro"

  const TEAM_AVATARS = [
    "1507003211169-0a1dd7228f2d",
    "1494790108377-be9c29b29330",
    "1534528741775-53994a69daeb",
    "1506794778202-cad84cf45f1d",
  ]

  type GalleryItem =
    | { type: "single"; src: string; alt: string; span: string }
    | { type: "before-after"; before: string; after: string; alt: string; span: string }

  const GALLERY_ITEMS: GalleryItem[] = [
    { type: "before-after", before: "photo-1580618672591-eb180b1a973f", after: "photo-1605497788044-5a32c7078486", alt: "Trasformazione colore", span: "md:row-span-2" },
    { type: "single", src: "photo-1595476108010-b4d1f102b1b1", alt: "Strumenti professionali", span: "" },
    { type: "single", src: "photo-1633681926022-84c23e8cb2d6", alt: "Colorazione", span: "" },
    { type: "before-after", before: "photo-1519699047748-de8e457a634e", after: "photo-1492106087820-71f1a00d2b11", alt: "Taglio moderno", span: "md:row-span-2" },
    { type: "single", src: "photo-1560066984-138dadb4c035", alt: "Salone interno", span: "" },
    { type: "single", src: "photo-1522337360788-8b13dee7a37e", alt: "Acconciatura", span: "" },
  ]

  const avgRating =
    operators.length > 0
      ? (
          operators.reduce((sum, op) => sum + op.rating, 0) / operators.length
        ).toFixed(1)
      : "5.0"

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      {/* ===== MOBILE NAVBAR — floating pill ===== */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border/20 pt-[env(safe-area-inset-top)]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-[15px] font-extrabold gradient-text">
              {salonName}
            </span>
          </Link>
          <MobileNav salonName={salonName} />
        </div>
      </nav>

      {/* ===== DESKTOP NAVBAR — floating pill ===== */}
      <nav className="hidden md:block fixed top-3 left-3 right-3 z-50 glass rounded-2xl border border-border/20 shadow-lg shadow-black/5 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-extrabold gradient-text">
              {salonName}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: "#servizi", label: "Servizi" },
              { href: "#team", label: "Team" },
              { href: "#gallery", label: "Galleria" },
              { href: "#shop", label: "Shop" },
              { href: "#contatti", label: "Contatti" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 h-9 rounded-lg text-sm" asChild>
              <Link href="/login" aria-label="Accedi">
                <LogIn className="w-4 h-4" />
                Accedi
              </Link>
            </Button>
            <Link
              href="/registrati"
              className="btn-gradient px-4 py-2 rounded-xl font-bold text-sm inline-flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrati
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20">
        {/* [10] Parallax background */}
        <ParallaxHero
          imageUrl="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1920&q=80"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/90" />

        {/* Animated blobs */}
        <div className="absolute top-20 right-16 w-72 h-72 rounded-full blur-[120px] bg-[oklch(0.55_0.24_25/0.25)] animate-float" />
        <div
          className="absolute bottom-32 left-16 w-80 h-80 rounded-full blur-[120px] bg-[oklch(0.42_0.18_260/0.2)] animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-heading font-extrabold mb-6 animate-slide-up leading-[1.05] tracking-tight">
            Il salone che{" "}
            <span className="gradient-text-animated">ti capisce</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            Prenota in 10 secondi, scegli il tuo esperto preferito e goditi il
            risultato. Noi pensiamo a tutto il resto.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            <Link href="/login" className="btn-gradient text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold inline-flex items-center gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Prenota ora
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Button variant="outline" size="lg" className="rounded-xl sm:rounded-2xl px-5 sm:px-8 py-3 sm:py-4 text-base sm:text-lg gap-2 border-border/50 hover:bg-muted/50" asChild>
              <Link href="/shop">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                Scopri lo shop
              </Link>
            </Button>
          </div>

          {/* [6] Smart Stats */}
          <div
            className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto mt-8 sm:mt-14 animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="text-center">
              {operators.length >= 5 ? (
                <>
                  <p className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">
                    <AnimatedCounter target={operators.length} suffix="+" />
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Esperti</p>
                </>
              ) : (
                <>
                  <p className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">Top</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Esperti</p>
                </>
              )}
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">
                <AnimatedCounter target={allServices.length} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Servizi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">
                {avgRating}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* [5] Scroll indicator — links to next section */}
        <a
          href="#come-funziona"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <span className="text-xs tracking-[0.2em] uppercase font-medium">
            Scorri
          </span>
          <ChevronDown
            className="w-5 h-5"
            style={{ animation: "scroll-hint 2s ease-in-out infinite" }}
          />
        </a>
      </section>

      {/* ===== SERVICE MARQUEE ===== */}
      <div className="py-6 border-y border-border/30 gradient-bg-subtle">
        <Marquee speed={25}>
          {allServices.map((service, i) => (
            <span
              key={i}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap"
            >
              <Scissors className="w-3.5 h-3.5 text-primary" />
              {service.name}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ===== COME FUNZIONA ===== */}
      <section id="come-funziona" className="py-10 sm:py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Semplicissimo
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                Come <span className="gradient-text">funziona</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Tre step. Dieci secondi. Fatto.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                step: "01",
                icon: Calendar,
                title: "Scegli data e ora",
                desc: "Guarda gli slot liberi in tempo reale e prenota quello che fa per te.",
              },
              {
                step: "02",
                icon: Users,
                title: "Scegli il tuo esperto",
                desc: "Ogni membro del team ha il suo stile. Trova quello che parla la tua lingua.",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Siediti e goditi",
                desc: "Rilassati, ci pensiamo noi. Riceverai un reminder prima dell'appuntamento.",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 150}>
                  <Card className="glass glow-card hover-lift h-full relative group">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-4xl sm:text-5xl font-heading font-extrabold text-primary/10 mb-2 sm:mb-3">
                        {item.step}
                      </div>
                      <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:animate-pop">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-heading font-bold mb-2 sm:mb-3">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ===== SERVIZI ===== */}
      <section id="servizi" className="py-10 sm:py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Cosa offriamo
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                I nostri <span className="gradient-text">servizi</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                I trattamenti preferiti dai nostri clienti
              </p>
            </div>
          </ScrollReveal>

          {popularServices.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {popularServices.map((service, i) => (
                <ScrollReveal key={service.id} delay={i * 70}>
                  <Card className="glass glow-card hover-lift group h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 group-hover:animate-pop shadow-md shadow-primary/20">
                          <Scissors className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-heading font-bold truncate">
                            {service.name}
                          </h3>
                        </div>
                        <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                          {service.duration}&apos;
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2.5">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold gradient-text">
                          &euro;{service.price.toFixed(0)}
                        </span>
                        <Link href="/login">
                          <span className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 cursor-pointer">
                            Prenota <ArrowRight className="w-3 h-3" />
                          </span>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              I servizi saranno disponibili a breve
            </p>
          )}
        </div>
      </section>

      {/* ===== TEAM ===== */}
      {operators.length > 0 && (
        <section id="team" className="py-10 sm:py-14 px-4 gradient-bg-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[150px] bg-[oklch(0.55_0.24_25/0.08)]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[150px] bg-[oklch(0.42_0.18_260/0.08)]" />

          <div className="max-w-6xl mx-auto relative">
            <ScrollReveal>
              <div className="text-center mb-10">
                <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                  Chi siamo
                </span>
                <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                  Il nostro <span className="gradient-text">team</span>
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                  Ognuno con il suo stile. Tutti con la stessa passione.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {operators.map((operator, i) => (
                <ScrollReveal key={operator.id} delay={i * 120}>
                  <Card className="glass text-center overflow-hidden hover-lift glow-card group h-full">
                    <CardContent className="p-6">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                          <img
                            loading="lazy"
                            src={`https://images.unsplash.com/photo-${TEAM_AVATARS[i % TEAM_AVATARS.length]}?w=200&h=200&fit=crop&crop=face`}
                            alt={operator.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        {operator.rating >= 4.5 && (
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center border-2 border-background float-slow">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-heading font-bold">
                        {operator.name}
                      </h3>
                      <p className="text-sm text-primary/80 font-medium mb-3">
                        {operator.role}
                      </p>

                      {operator.rating > 0 && (
                        <div className="flex items-center justify-center gap-1.5 mb-3">
                          <StarRating rating={operator.rating} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            ({operator.reviewCount})
                          </span>
                        </div>
                      )}

                      {operator.specializations && (
                        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                          {operator.specializations
                            .split(",")
                            .slice(0, 3)
                            .map((s) => (
                              <span
                                key={s}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                              >
                                {s.trim()}
                              </span>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PERCHE' NOI — Bento grid ===== */}
      <section className="py-10 sm:py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Perché sceglierci
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                Non il solito <span className="gradient-text">salone</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Zap,
                title: "Prenotazione istantanea",
                desc: "Niente telefonate, niente attese. Prenoti dal telefono in 10 secondi.",
                variant: "left" as const,
              },
              {
                icon: Heart,
                title: "Il tuo esperto preferito",
                desc: "Scegli sempre chi ti segue. Noi ricordiamo le tue preferenze.",
                variant: "right" as const,
              },
              {
                icon: Star,
                title: "Qualità garantita",
                desc: "Prodotti professionali, formazione continua, risultati che si vedono.",
                variant: "left" as const,
              },
              {
                icon: ShoppingBag,
                title: "Shop dedicato",
                desc: "I prodotti che usiamo in salone, disponibili anche per te a casa.",
                variant: "right" as const,
              },
            ].map((item, i) => (
              <ScrollReveal key={item.title} variant={item.variant} delay={i * 100}>
                <Card className="glass hover-lift glow-card group h-full">
                  <CardContent className="p-6 flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0 group-hover:animate-pop">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold mb-1">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ===== [3] GALLERY ===== */}
      <section id="gallery" className="py-10 sm:py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Il nostro mondo
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                <Camera className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-3 text-primary" />
                La nostra <span className="gradient-text">galleria</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg">
                Uno sguardo al nostro salone e ai nostri lavori
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 auto-rows-[160px] sm:auto-rows-[200px] md:auto-rows-[250px]">
            {GALLERY_ITEMS.map((item, i) => (
              <ScrollReveal key={`gallery-${i}`} variant="scale" delay={i * 80}>
                {item.type === "before-after" ? (
                  <div className={`h-full ${item.span}`}>
                    <BeforeAfterSlider
                      beforeSrc={`https://images.unsplash.com/${item.before}?w=600&h=500&fit=crop`}
                      afterSrc={`https://images.unsplash.com/${item.after}?w=600&h=500&fit=crop`}
                      className="h-full"
                    />
                  </div>
                ) : (
                  <div className={`relative overflow-hidden rounded-2xl group h-full ${item.span}`}>
                    <img
                      loading="lazy"
                      src={`https://images.unsplash.com/${item.src}?w=600&h=400&fit=crop`}
                      alt={item.alt}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <p className="absolute bottom-3 left-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      {item.alt}
                    </p>
                  </div>
                )}
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/showcase">
              <Button variant="outline" className="gap-2 rounded-xl">
                Vedi tutti i nostri lavori <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ===== RECENSIONI ===== */}
      {reviews.length > 0 && (
        <section id="recensioni" className="py-10 sm:py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-10">
                <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                  Voci reali
                </span>
                <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                  Cosa dicono di <span className="gradient-text">noi</span>
                </h2>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <StarRating rating={5} size="md" />
                  <span className="text-lg font-bold">{avgRating}</span>
                  <span className="text-muted-foreground text-sm">
                    media recensioni
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <ScrollReveal key={review.id} delay={i * 100}>
                  <Card className="glass hover-lift group h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <StarRating rating={5} size="sm" className="mb-4" />
                      {review.comment && (
                        <p className="text-sm mb-6 text-muted-foreground leading-relaxed flex-1 italic">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                            {review.user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">
                              {review.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              con {review.operator.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground/70">
                          {new Date(review.createdAt).toLocaleDateString(
                            "it-IT",
                            { month: "short", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== SHOP PREVIEW ===== */}
      {products.length > 0 && (
        <section id="shop" className="py-10 sm:py-14 px-4 gradient-bg-subtle relative overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-[100px] bg-[oklch(0.55_0.24_25/0.08)]" />

          <div className="max-w-6xl mx-auto relative">
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                    Shop
                  </span>
                  <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3">
                    I prodotti che{" "}
                    <span className="gradient-text">usiamo</span>
                  </h2>
                  <p className="text-muted-foreground mt-2 text-lg">
                    Ora anche tuoi. Qualità professionale, a casa tua.
                  </p>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 border-border/50" asChild>
                  <Link href="/shop">
                    Vedi tutti
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product, i) => (
                <ScrollReveal key={product.id} variant="scale" delay={i * 100}>
                  <Link href={`/shop/${product.id}`}>
                    <Card className="glass hover-lift glow-card group h-full overflow-hidden cursor-pointer">
                      <div className="aspect-square bg-muted/50 relative overflow-hidden">
                        {product.image ? (
                          <img
                            loading="lazy"
                            src={proxyImageUrl(product.image)!}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-primary text-white font-bold">
                              -
                              {Math.round(
                                (1 - product.price / product.originalPrice) *
                                  100
                              )}
                              %
                            </span>
                          )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {product.category}
                        </p>
                        <h3 className="font-heading font-bold text-sm mb-2 line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold gradient-text">
                            &euro;{product.price.toFixed(0)}
                          </span>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                &euro;{product.originalPrice.toFixed(0)}
                              </span>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA FINALE ===== */}
      <section className="py-10 sm:py-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] bg-[oklch(0.55_0.24_25/0.12)]" />

        <ScrollReveal variant="scale">
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mb-6">
              Pronto per il tuo{" "}
              <span className="gradient-text-animated">nuovo look</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Registrati gratis e prenota il tuo primo appuntamento. Ci vediamo
              in salone.
            </p>
            <Link href="/registrati" className="btn-gradient text-lg px-10 py-4 rounded-2xl font-bold inline-flex items-center gap-3 animate-glow">
              <UserPlus className="w-5 h-5" />
              Crea il tuo account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ===== [7] FAQ ===== */}
      <section id="faq" className="py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Hai domande?
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3 mb-4">
                Domande <span className="gradient-text">frequenti</span>
              </h2>
            </div>
          </ScrollReveal>
          <FAQSection />
        </div>
      </section>

      <div className="divider-gradient max-w-4xl mx-auto" />

      {/* ===== CONTATTI / ORARI ===== */}
      <section id="contatti" className="py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">
                Dove siamo
              </span>
              <h2 className="text-2xl sm:text-5xl font-heading font-extrabold mt-3">
                Vieni a <span className="gradient-text">trovarci</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollReveal variant="left">
              <Card className="glass hover-lift h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-bold mb-4">
                    Info & Contatti
                  </h3>
                  <div className="space-y-4">
                    {settings?.address && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-muted-foreground mt-2">
                          {settings.address}
                        </span>
                      </div>
                    )}
                    {settings?.phone && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-muted-foreground">
                          {settings.phone}
                        </span>
                      </div>
                    )}
                    {settings?.email && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-muted-foreground">
                          {settings.email}
                        </span>
                      </div>
                    )}
                    {!settings?.address &&
                      !settings?.phone &&
                      !settings?.email && (
                        <p className="text-muted-foreground">
                          Contattaci per maggiori informazioni
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal variant="right">
              <Card className="glass hover-lift h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-bold mb-4">
                    Orari
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold">Lunedì — Sabato</p>
                        <p className="text-muted-foreground">
                          Mattina: 9:00 — 12:30
                        </p>
                        <p className="text-muted-foreground">
                          Pomeriggio: 14:30 — 19:00
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-bold">Domenica</p>
                        <p className="text-muted-foreground">Chiuso</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link href="/login" className="btn-gradient w-full py-3.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 text-base">
                      <Calendar className="w-4 h-4" />
                      Prenota il tuo appuntamento
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 sm:py-16 px-4 border-t border-border/50 gradient-bg-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] bg-[oklch(0.55_0.24_25/0.05)]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[120px] bg-[oklch(0.42_0.18_260/0.05)]" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading text-lg font-extrabold gradient-text">
                  {salonName}
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Il tuo salone di fiducia. Prenota online, accumula punti e scopri i migliori trattamenti.
              </p>
              <div className="flex items-center gap-2">
                {[
                  { label: "Instagram", icon: <Instagram className="w-4 h-4" /> },
                  { label: "Facebook", icon: <Facebook className="w-4 h-4" /> },
                  { label: "TikTok", icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.37a8.16 8.16 0 004.76 1.53v-3.4a4.85 4.85 0 01-1-.81z" /></svg> },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all text-muted-foreground hover:scale-110"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link Rapidi */}
            <div>
              <h4 className="font-heading font-bold text-sm mb-4">Link Rapidi</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "#servizi", label: "Servizi" },
                  { href: "#team", label: "Il Team" },
                  { href: "#gallery", label: "Galleria" },
                  { href: "#contatti", label: "Contatti" },
                  { href: "/shop", label: "Shop" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Orari */}
            <div>
              <h4 className="font-heading font-bold text-sm mb-4">Orari</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex justify-between">
                  <span>Lun — Sab</span>
                  <span className="font-medium text-foreground text-xs">9:00–12:30 / 14:30–19:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Domenica</span>
                  <span className="text-muted-foreground">Chiuso</span>
                </li>
              </ul>
              <div className="mt-4">
                <Link href="/login" className="btn-gradient px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Prenota ora
                </Link>
              </div>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-heading font-bold text-sm mb-4">Il tuo Account</h4>
              <ul className="space-y-2.5">
                {[
                  { href: "/login", label: "Accedi" },
                  { href: "/registrati", label: "Registrati" },
                  { href: "/shop", label: "Shop Online" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="divider-gradient my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} {salonName}. Tutti i diritti riservati.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
              <span className="hover:text-muted-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-muted-foreground transition-colors cursor-pointer">Termini di Servizio</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== FLOATING BUTTONS ===== */}
      {/* [8] Back to top */}
      <BackToTop />
      {/* [2] WhatsApp */}
      {settings?.phone && <WhatsAppButton phone={settings.phone} />}
    </div>
  )
}
