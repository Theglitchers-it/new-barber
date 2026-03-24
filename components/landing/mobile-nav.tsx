"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import {
  Scissors, LogIn, UserPlus, ShoppingBag,
  Users, Camera, Phone, Star, Calendar, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/landing/theme-toggle"

const navLinks = [
  { href: "#servizi", label: "Servizi", icon: Scissors },
  { href: "#team", label: "Il Team", icon: Users },
  { href: "#gallery", label: "Galleria", icon: Camera },
  { href: "#shop", label: "Shop", icon: ShoppingBag },
  { href: "#recensioni", label: "Recensioni", icon: Star },
  { href: "#contatti", label: "Contatti", icon: Phone },
]

export function MobileNav({ salonName = "SalonPro" }: { salonName?: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef(0)

  useEffect(() => { setMounted(true) }, [])

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (open) {
      scrollRef.current = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollRef.current}px`
      document.body.style.width = "100%"

      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") close()
      }
      document.addEventListener("keydown", handler)

      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.scrollTo(0, scrollRef.current)
        document.removeEventListener("keydown", handler)
      }
    }
  }, [open])

  const overlay = open && mounted
    ? createPortal(
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigazione"
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
            onClick={close}
          />

          <div className="absolute inset-0 flex flex-col bg-background animate-fade-in">
            <div className="pt-[env(safe-area-inset-top)]">
              <div className="h-14 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
                    <Scissors className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-heading text-[15px] font-extrabold gradient-text">
                    {salonName}
                  </span>
                </div>
                <button
                  onClick={close}
                  className="w-10 h-10 flex items-center justify-center rounded-xl glass-subtle transition-all duration-300 active:scale-95"
                  aria-label="Chiudi menu"
                >
                  <div className="w-5 h-4 relative flex flex-col justify-between">
                    <span className="block h-[2px] w-5 bg-foreground rounded-full rotate-45 translate-y-[7px]" />
                    <span className="block h-[2px] w-5 bg-foreground rounded-full opacity-0" />
                    <span className="block h-[2px] w-5 bg-foreground rounded-full -rotate-45 -translate-y-[7px]" />
                  </div>
                </button>
              </div>
            </div>

            <div className="divider-gradient mx-6 mt-4" />

            <nav className="flex-1 flex flex-col justify-start px-6 pt-4 overflow-y-auto">
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="group flex items-center gap-4 px-4 py-3 rounded-2xl text-lg font-semibold text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-all duration-300 active:scale-[0.97]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300" />
                  </a>
                ))}
              </div>
            </nav>

            <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-3">
              <Link
                href="/login"
                onClick={close}
                className="btn-gradient flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
              >
                <Calendar className="w-5 h-5" />
                Prenota ora
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex-1 glass flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold hover:bg-muted/50 transition-all active:scale-[0.97]"
                >
                  <LogIn className="w-4 h-4" />
                  Accedi
                </Link>
                <Link
                  href="/registrati"
                  onClick={close}
                  className="flex-1 glass flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold hover:bg-muted/50 transition-all active:scale-[0.97]"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrati
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <div className="flex items-center">
      <button
        onClick={toggle}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl glass-subtle transition-all duration-300 active:scale-95"
        aria-label={open ? "Chiudi menu" : "Apri menu"}
        aria-expanded={open}
      >
        <div className="w-5 h-4 relative flex flex-col justify-between">
          <span
            className={cn(
              "block h-[2px] w-5 bg-foreground rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-center",
              open && "rotate-45 translate-y-[7px]"
            )}
          />
          <span
            className={cn(
              "block h-[2px] w-5 bg-foreground rounded-full transition-all duration-300 origin-center",
              open && "opacity-0 scale-x-0"
            )}
          />
          <span
            className={cn(
              "block h-[2px] w-5 bg-foreground rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-center",
              open && "-rotate-45 -translate-y-[7px]"
            )}
          />
        </div>
      </button>

      {overlay}
    </div>
  )
}
