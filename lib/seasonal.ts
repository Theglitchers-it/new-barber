import { Sun, Snowflake, Leaf, Flower2, type LucideIcon } from "lucide-react"

export type Season = "spring" | "summer" | "autumn" | "winter"

export interface SeasonalConfig {
  season: Season
  label: string
  headline: string
  description: string
  icon: LucideIcon
  gradient: string
  serviceKeywords: string[]
  productKeywords: string[]
}

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() // 0-11
  if (month >= 2 && month <= 4) return "spring"
  if (month >= 5 && month <= 7) return "summer"
  if (month >= 8 && month <= 10) return "autumn"
  return "winter"
}

const configs: Record<Season, SeasonalConfig> = {
  spring: {
    season: "spring",
    label: "Primavera",
    headline: "Rinnova il tuo look",
    description: "È il momento perfetto per un cambio colore o un taglio fresco. La primavera è rinascita!",
    icon: Flower2,
    gradient: "from-pink-500/20 via-rose-400/10 to-amber-300/20",
    serviceKeywords: ["colore", "balayage", "meches", "trattamento"],
    productKeywords: ["colore", "rivitalizzante", "spray"],
  },
  summer: {
    season: "summer",
    label: "Estate",
    headline: "Proteggi i tuoi capelli",
    description: "Sole, mare e piscina stressano i capelli. Proteggili con i nostri trattamenti estivi.",
    icon: Sun,
    gradient: "from-amber-500/20 via-orange-400/10 to-yellow-300/20",
    serviceKeywords: ["trattamento", "taglio", "piega"],
    productKeywords: ["solare", "protezione", "idratante", "spray"],
  },
  autumn: {
    season: "autumn",
    label: "Autunno",
    headline: "Tempo di cambiare",
    description: "Colorazioni calde e trattamenti riparazione per tornare al top dopo l'estate.",
    icon: Leaf,
    gradient: "from-orange-500/20 via-amber-400/10 to-red-300/20",
    serviceKeywords: ["colore", "trattamento", "cheratina"],
    productKeywords: ["riparazione", "maschera", "olio", "cheratina"],
  },
  winter: {
    season: "winter",
    label: "Inverno",
    headline: "Coccola i tuoi capelli",
    description: "Il freddo secca i capelli. Idratazione profonda e styling perfetto per le feste.",
    icon: Snowflake,
    gradient: "from-blue-500/20 via-indigo-400/10 to-purple-300/20",
    serviceKeywords: ["trattamento", "piega", "styling"],
    productKeywords: ["idratante", "maschera", "olio", "styling"],
  },
}

export function getSeasonalConfig(): SeasonalConfig {
  return configs[getCurrentSeason()]
}
