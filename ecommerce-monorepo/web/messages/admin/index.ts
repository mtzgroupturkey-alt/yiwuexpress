import { adminEn, type AdminDictionary } from './en'
import { adminRu } from './ru'
import { adminZh } from './zh'

export type AdminLocale = 'en' | 'ru' | 'zh'

export const adminMessages: Record<AdminLocale, AdminDictionary> = {
  en: adminEn,
  ru: adminRu,
  zh: adminZh,
}

export { adminEn, adminRu, adminZh, type AdminDictionary }
