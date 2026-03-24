import { Scissors, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-bg-subtle" />
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full blur-[100px] bg-[oklch(0.55_0.24_25/0.15)] animate-float" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full blur-[100px] bg-[oklch(0.42_0.18_260/0.1)] animate-float" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] bg-[oklch(0.82_0.01_250/0.08)] animate-pulse-soft" />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo — clickable, links to home */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 animate-bounce-in">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-2xl font-extrabold gradient-text">SalonPro</span>
        </Link>

        <div className="animate-slide-up">
          {children}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Torna al sito
          </Link>
        </div>
      </div>
    </div>
  )
}
