"use client"

import { useRef, useEffect, useState } from "react"

export function ParallaxHero({
  imageUrl,
  className = "",
}: {
  imageUrl: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setOffset(window.scrollY * 0.4)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      ref={ref}
      className={`bg-cover bg-center will-change-transform ${className}`}
      style={{
        backgroundImage: `url('${imageUrl}')`,
        transform: `translateY(${offset}px)`,
      }}
    />
  )
}
