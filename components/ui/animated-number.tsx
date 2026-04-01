"use client"

import { useEffect, useRef } from "react"
import { useSpring, useTransform, motion, useInView } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  className?: string
  formatFn?: (value: number) => string
}

export function AnimatedNumber({ value, className, formatFn }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) =>
    formatFn ? formatFn(Math.round(current)) : Math.round(current).toLocaleString("it-IT")
  )

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [spring, value, isInView])

  return <motion.span ref={ref} className={className}>{display}</motion.span>
}
