import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'

// Define supported languages
export type SupportedLanguage = 'ar' | 'en' | 'es' | 'pt' | 'fr' | 'de'

// Define namespaces
export const namespaces = [
  'common',
  'members',
  'plans',
  'accounts',
  'memberships',
  'checkIns',
  'dashboard',
  'reports',
  'settings',
  'license',
  'store',
  'classes',
  'billing'
] as const

// Lazy load translation resources
i18n
  .use(
    resourcesToBackend((language: string, namespace: string) => {
      return import(`./${language}/${namespace}.json`)
    })
  )
  .use(initReactI18next)
  .init({
    lng: 'ar',
    fallbackLng: 'en',
    ns: namespaces,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
