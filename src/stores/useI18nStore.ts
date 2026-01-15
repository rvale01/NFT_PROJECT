import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import enTranslations from '../translations/en.json'
import itTranslations from '../translations/it.json'
import zhTranslations from '../translations/zh.json'

const translations = {
  en: enTranslations,
  it: itTranslations,
  zh: zhTranslations,
} as const

export type Language = keyof typeof translations

const languageNames: Record<Language, string> = {
  en: 'English',
  it: 'Italiano',
  zh: '中文',
}

interface I18nState {
  language: Language
  availableLanguages: Language[]
  languageNames: Record<Language, string>
  t: (key: string, params?: Record<string, string | number>) => string
  changeLanguage: (lang: Language) => void
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => {
      const getInitialLanguage = (): Language => {
        const saved = localStorage.getItem('i18n-storage')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed.state?.language && translations[parsed.state.language as Language]) {
              return parsed.state.language as Language
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        const browserLang = navigator.language.split('-')[0] as Language
        return translations[browserLang] ? browserLang : 'en'
      }

      return {
        language: getInitialLanguage(),
        availableLanguages: Object.keys(translations) as Language[],
        languageNames,

        t: (key, params = {}) => {
          const { language } = get()
          const keys = key.split('.')
          let value: any = translations[language]

          for (const k of keys) {
            if (value && typeof value === 'object') {
              value = value[k]
            } else {
              console.warn(`Translation key "${key}" not found for language "${language}"`)
              return key
            }
          }

          if (typeof value !== 'string') {
            console.warn(`Translation key "${key}" is not a string for language "${language}"`)
            return key
          }

          // Replace parameters in the translation string
          let result = value
          Object.keys(params).forEach((param) => {
            result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]))
          })

          return result
        },

        changeLanguage: (lang) => {
          if (translations[lang]) {
            set({ language: lang })
          } else {
            console.warn(`Language "${lang}" is not supported`)
          }
        },
      }
    },
    {
      name: 'i18n-storage',
    }
  )
)

// Helper hook for easier access
export const useI18n = () => {
  const store = useI18nStore()
  return {
    t: store.t,
    language: store.language,
    changeLanguage: store.changeLanguage,
    availableLanguages: store.availableLanguages,
    languageNames: store.languageNames,
  }
}

