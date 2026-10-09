import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { adminEn } from '@/messages/admin/en'
import { adminRu } from '@/messages/admin/ru'
import { adminZh } from '@/messages/admin/zh'
import enJson from '@/messages/en.json'
import ruJson from '@/messages/ru.json'
import zhJson from '@/messages/zh.json'
import { COUNTRIES } from '@/lib/countries'

describe('i18n Sweden vs Swedish audit', () => {
  const messagesDir = path.resolve(__dirname, '../../messages')

  it('scans all messages dictionary files and asserts no file contains the unapproved word "Sweden"', () => {
    const files = [
      path.join(messagesDir, 'en.json'),
      path.join(messagesDir, 'ru.json'),
      path.join(messagesDir, 'zh.json'),
      path.join(messagesDir, 'admin/en.ts'),
      path.join(messagesDir, 'admin/ru.ts'),
      path.join(messagesDir, 'admin/zh.ts'),
    ]

    for (const file of files) {
      expect(fs.existsSync(file), `File ${file} should exist`).toBe(true)
      const content = fs.readFileSync(file, 'utf-8')

      // Case-insensitive regex looking for whole word "Sweden"
      const swedenWordMatches = content.match(/\bSweden\b/gi) || []
      
      // Zero unapproved occurrences of "Sweden" in language files
      expect(
        swedenWordMatches,
        `File ${path.basename(file)} should not contain "Sweden". Found matches: ${JSON.stringify(swedenWordMatches)}`
      ).toEqual([])
    }
  })

  it('asserts admin dictionaries provide localized Swedish Name labels', () => {
    // English admin dictionary
    expect(adminEn.products.swedishName).toBe('Swedish Name')
    expect(adminEn.products.swedishNameDesc).toBe('Original Swedish series / brand name')

    // Russian admin dictionary
    expect(adminRu.products.swedishName).toBe('Шведское наименование')
    expect(adminRu.products.swedishNameDesc).toBe('Оригинальное шведское наименование серии или бренда')

    // Chinese admin dictionary
    expect(adminZh.products.swedishName).toBe('瑞典语原名')
    expect(adminZh.products.swedishNameDesc).toBe('原厂瑞典语系列/品牌标识名称')
  })

  it('asserts storefront JSON dictionaries provide localized Swedish Name labels under Product', () => {
    expect((enJson as any).Product.swedishName).toBe('Swedish Name')
    expect((enJson as any).Product.swedishNameDesc).toBe('Original Swedish series / brand name')

    expect((ruJson as any).Product.swedishName).toBe('Шведское наименование')
    expect((ruJson as any).Product.swedishNameDesc).toBe('Оригинальное шведское наименование серии или бренда')

    expect((zhJson as any).Product.swedishName).toBe('瑞典语原名')
    expect((zhJson as any).Product.swedishNameDesc).toBe('原厂瑞典语系列/品牌标识名称')
  })

  it('verifies intentional exceptions: countries catalog retains Sweden as ISO-3166 country name', () => {
    const swedenEntry = COUNTRIES.find((c) => c.code === 'SE')
    expect(swedenEntry).toBeDefined()
    expect(swedenEntry?.name).toBe('Sweden')
  })
})
