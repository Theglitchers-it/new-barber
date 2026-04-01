import { it, type TranslationKey } from "./it"
import { en } from "./en"

export type Locale = "it" | "en"

const dictionaries: Record<Locale, Record<string, string>> = { it, en }

export type TranslateFn = (key: TranslationKey, params?: Record<string, string>) => string

export function getTranslation(locale: Locale): TranslateFn {
  const dict = dictionaries[locale] || dictionaries.it

  return (key: TranslationKey, params?: Record<string, string>) => {
    let text = dict[key] || dictionaries.it[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v)
      }
    }
    return text
  }
}

export { type TranslationKey }
