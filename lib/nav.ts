import {
  Home,
  Calendar,
  Crown,
  Users,
  Star,
  ShoppingBag,
  Package,
  Gift,
  UserCircle,
  Scissors,
  CalendarHeart,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  adminOnly?: boolean
  clientOnly?: boolean
}

export const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/prenotazioni", icon: Calendar, label: "Prenotazioni" },
  { href: "/operatori", icon: Crown, label: "Team", adminOnly: true },
  { href: "/clienti", icon: Users, label: "Clienti", adminOnly: true },
  { href: "/recensioni", icon: Star, label: "Recensioni", adminOnly: true },
  { href: "/shop", icon: ShoppingBag, label: "Shop" },
  { href: "/ordini", icon: Package, label: "Ordini" },
  { href: "/fedelta", icon: Gift, label: "Fedeltà" },
  { href: "/timeline", icon: Scissors, label: "I Miei Capelli", clientOnly: true },
  { href: "/calendario", icon: CalendarHeart, label: "Calendario", clientOnly: true },
  { href: "/profilo", icon: UserCircle, label: "Profilo", clientOnly: true },
]

export function filterNavItems(items: NavItem[], isAdmin: boolean): NavItem[] {
  return items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.clientOnly && isAdmin) return false
    return true
  })
}
