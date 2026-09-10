import en from './en'
import fr from './fr'
import es from './es'
import pt from './pt'
import de from './de'

export const languages = {
  en: { label: 'English', flag: '🇬🇧', translations: en },
  fr: { label: 'Français', flag: '🇫🇷', translations: fr },
  es: { label: 'Español', flag: '🇪🇸', translations: es },
  pt: { label: 'Português', flag: '🇵🇹', translations: pt },
  de: { label: 'Deutsch', flag: '🇩🇪', translations: de },
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

function interpolate(str, params) {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    if (key === 'count' || key === 'period' || key === 'version' || key === 'index') {
      return params[key] ?? `{${key}}`
    }
    return params[key] ?? `{${key}}`
  })
}

function pluralize(str, count) {
  if (!str || !str.includes('plural')) return str
  const match = str.match(/\{count, plural, one \{([^}]+)\} other \{([^}]+)\}\}/)
  if (!match) return str
  return count === 1 ? match[1].replace('#', count) : match[2].replace('#', count)
}

export function translate(lang, key, params) {
  const translations = languages[lang]?.translations || languages.en.translations
  let value = getNestedValue(translations, key)
  if (value === undefined) {
    value = getNestedValue(languages.en.translations, key)
  }
  if (value === undefined) return key
  if (typeof value !== 'string') return String(value)
  if (params?.count !== undefined) {
    value = pluralize(value, params.count)
  }
  return interpolate(value, params)
}
