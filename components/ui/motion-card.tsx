"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MotionCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function MotionCard({ children, className, delay = 0 }: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md", className)}
    >
      {children}
    </motion.div>
  )
}
