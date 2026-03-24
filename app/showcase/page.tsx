import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BeforeAfterSlider } from "@/components/ui/before-after-slider"
import { Camera, ArrowRight, Scissors } from "lucide-react"
import Link from "next/link"

export default async function ShowcasePage() {
  const items = await prisma.operatorPortfolio.findMany({
    where: { published: true },
    include: {
      operator: { select: { id: true, name: true, image: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-lg font-extrabold gradient-text">SalonPro</span>
          </Link>
          <Link href="/login">
            <Button size="sm" className="gap-1.5">
              Prenota <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <span className="text-xs tracking-[0.2em] uppercase text-primary font-bold">I nostri lavori</span>
          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold mt-2">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-2 text-primary" />
            Showcase
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Sfoglia le trasformazioni realizzate dai nostri stilisti
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-lg font-heading font-bold">Prossimamente</p>
            <p className="text-muted-foreground mt-1">Stiamo preparando il nostro portfolio</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {items.map((item) => (
              <Card key={item.id} className="glass border-0 overflow-hidden hover-lift">
                {item.beforeImage ? (
                  <BeforeAfterSlider
                    beforeSrc={item.beforeImage}
                    afterSrc={item.afterImage}
                    className="aspect-[4/3]"
                  />
                ) : (
                  <div className="relative aspect-[4/3]">
                    <img
                      src={item.afterImage}
                      alt={item.caption || "Lavoro"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="gradient-primary text-[10px] font-bold text-white">
                        {item.operator.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{item.operator.name}</span>
                    {item.service && (
                      <Badge variant="secondary" className="text-[9px] ml-auto">
                        {item.service.name}
                      </Badge>
                    )}
                  </div>
                  {item.caption && (
                    <p className="text-xs text-muted-foreground">{item.caption}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-3">Ti piace quello che vedi?</p>
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Prenota il tuo appuntamento <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
