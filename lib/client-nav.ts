import {
  Home,
  Calendar,
  ShoppingBag,
  Gift,
  UserCircle,
  Package,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface ClientNavItem {
  href: string
  icon: LucideIcon
  label: string
}

export const clientNavItems: ClientNavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/prenotazioni", icon: Calendar, label: "Prenota" },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/fedelta", icon: Gift, label: "Fedeltà" },
  { href: "/profilo", icon: UserCircle, label: "Profilo" },
]
