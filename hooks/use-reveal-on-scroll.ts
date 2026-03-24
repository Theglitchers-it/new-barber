"use client"

import { useEffect } from "react"

export function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
