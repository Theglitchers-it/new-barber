import { cookies, headers } from "next/headers"
import { getTranslation, type Locale, type TranslateFn } from "./index"

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("locale")?.value
  if (localeCookie === "en" || localeCookie === "it") return localeCookie

  const headerStore = await headers()
  const acceptLang = headerStore.get("accept-language") || ""
  if (acceptLang.startsWith("en")) return "en"

  return "it"
}

export async function getServerT(): Promise<TranslateFn> {
  const locale = await getServerLocale()
  return getTranslation(locale)
}
