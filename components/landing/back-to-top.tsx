"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-22 right-6 z-50 w-11 h-11 rounded-full glass flex items-center justify-center shadow-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      title="Torna in cima"
      aria-label="Torna in cima"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
