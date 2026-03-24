"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
  className,
}: {
  target: number
  suffix?: string
  duration?: number
  className?: string
}) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const rafRef = useRef<number>(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const runAnimation = (from: number, to: number) => {
      cancelAnimationFrame(rafRef.current)
      let startTime: number | null = null
      let prevRounded = from
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const rounded = Math.round(from + (to - from) * eased)
        if (rounded !== prevRounded) {
          prevRounded = rounded
          countRef.current = rounded
          setCount(rounded)
        }
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation(0, target)
        } else {
          runAnimation(countRef.current, 0)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return (
    <span ref={ref} className={className}>
      {count}
      {suffix}
    </span>
  )
}
