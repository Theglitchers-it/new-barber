"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  function toggle() {
    const html = document.documentElement
    const isDark = html.classList.contains("dark")
    const next = isDark ? "light" : "dark"
    // Update next-themes (works when hydrated)
    setTheme(next)
    // Direct DOM update as immediate visual feedback
    html.classList.toggle("dark", !isDark)
    html.style.colorScheme = next
  }

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-all duration-300"
      title="Cambia tema"
      aria-label="Cambia tema"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}
