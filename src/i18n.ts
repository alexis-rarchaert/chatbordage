import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false, // Utilise l'API Composition
  locale: 'fr', // Langue par défaut
  fallbackLocale: 'en', // Langue de secours
  messages: {
    fr,
    en
  }
})

export default i18n
