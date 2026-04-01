"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const MAX_STAGGER = 12

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemAnimated = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const itemInstant = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
}

interface StaggerListProps {
  children: ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, index }: { children: ReactNode; className?: string; index?: number }) {
  // Items beyond MAX_STAGGER appear instantly (no accumulated delay)
  const shouldAnimate = index === undefined || index < MAX_STAGGER
  return (
    <motion.div variants={shouldAnimate ? itemAnimated : itemInstant} className={cn(className)}>
      {children}
    </motion.div>
  )
}
