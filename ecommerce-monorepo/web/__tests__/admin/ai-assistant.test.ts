import { describe, it, expect } from 'vitest'
import {
  buildSystemPrompt,
  extractActionProposal,
} from '../../lib/ai-assistant/gateway'
import { PendingAction } from '../../lib/ai-assistant/types'

describe('AI Assistant Gateway & Safety Engine', () => {
  describe('System Prompt Generation', () => {
    it('generates system prompt with English locale and strict safety constraints', () => {
      const prompt = buildSystemPrompt('en', 'Category count: 50')
      expect(prompt).toContain('English (en)')
      expect(prompt).toContain('STRICT PROHIBITION: You must NEVER use or display the Persian (Farsi) language')
      expect(prompt).toContain('CRITICAL SAFETY & CONFIRMATION RULES')
      expect(prompt).toContain('Category count: 50')
      expect(prompt).toContain('action_proposal')
    })

    it('generates system prompt with Russian locale instructions', () => {
      const prompt = buildSystemPrompt('ru')
      expect(prompt).toContain('Russian (ru)')
      expect(prompt).toContain('Вы подтверждаете создание этих элементов?')
      expect(prompt).toContain('STRICT PROHIBITION')
    })

    it('generates system prompt with Chinese locale instructions', () => {
      const prompt = buildSystemPrompt('zh')
      expect(prompt).toContain('Simplified Chinese (zh)')
      expect(prompt).toContain('您确认创建这些项目吗？')
      expect(prompt).toContain('STRICT PROHIBITION')
    })
  })

  describe('extractActionProposal', () => {
    it('extracts a valid action proposal for category creation and strips code block', () => {
      const assistantText = `
I have prepared the categories for power tools. Here is what I will create:
- Cordless Drills (ru: Аккумуляторные дрели, zh: 无绳电钻)

Do you confirm?

\`\`\`action_proposal
{
  "type": "createCategories",
  "summary": "Create Cordless Drills category under Power Tools",
  "payload": {
    "categories": [
      {
        "name": "Cordless Drills",
        "slug": "cordless-drills",
        "parentName": "Power Tools",
        "translations": {
          "en": { "name": "Cordless Drills" },
          "ru": { "name": "Аккумуляторные дрели" },
          "zh": { "name": "无绳电钻" }
        }
      }
    ]
  }
}
\`\`\`
`
      const result = extractActionProposal(assistantText)
      expect(result.pendingAction).not.toBeNull()
      expect(result.pendingAction?.type).toBe('createCategories')
      expect(result.pendingAction?.summary).toBe('Create Cordless Drills category under Power Tools')
      expect(result.pendingAction?.payload.categories).toHaveLength(1)
      expect(result.pendingAction?.payload.categories?.[0].name).toBe('Cordless Drills')
      expect(result.pendingAction?.status).toBe('PENDING')
      // Ensure code block was stripped from clean text for user display
      expect(result.cleanText).not.toContain('```action_proposal')
      expect(result.cleanText).toContain('Do you confirm?')
    })

    it('extracts attribute creation proposals accurately', () => {
      const rawText = `
Here are the clothing attributes proposed.

\`\`\`action_proposal
{
  "type": "createAttributes",
  "summary": "Create Size and Color attributes",
  "payload": {
    "attributes": [
      {
        "name": "Size",
        "slug": "clothing-size",
        "type": "SELECT",
        "options": ["S", "M", "L", "XL"]
      }
    ]
  }
}
\`\`\`
`
      const result = extractActionProposal(rawText)
      expect(result.pendingAction?.type).toBe('createAttributes')
      expect(result.pendingAction?.payload.attributes?.[0].name).toBe('Size')
    })

    it('handles malformed JSON gracefully without crashing', () => {
      const brokenText = `
\`\`\`action_proposal
{
  "type": "createCategories",
  "brokenJson": true,
\`\`\`
`
      const result = extractActionProposal(brokenText)
      expect(result.pendingAction).toBeNull()
      expect(result.cleanText).toBe('')
    })

    it('extracts createProducts proposal with image URLs and translations', () => {
      const rawText = `I have prepared 5 sample products for Cutlery & Knives. Do you confirm?

\`\`\`action_proposal
{
  "type": "createProducts",
  "summary": "Create 5 sample products for Cutlery & Knives",
  "payload": {
    "products": [
      {
        "name": "Chef Knife 8-Inch",
        "slug": "chef-knife-8-inch",
        "sku": "CK-001",
        "categoryName": "Cutlery & Knives",
        "price": 49.99,
        "description": "High carbon stainless steel knife",
        "images": ["https://images.unsplash.com/photo-1593618998160-e34014e67546"],
        "translations": {
          "en": { "name": "Chef Knife 8-Inch" },
          "ru": { "name": "Поварской нож 20 см" },
          "zh": { "name": "8英寸主厨刀" }
        }
      }
    ]
  }
}
\`\`\`
`
      const result = extractActionProposal(rawText)
      expect(result.pendingAction?.type).toBe('createProducts')
      expect(result.pendingAction?.payload.products?.[0].sku).toBe('CK-001')
      expect(result.pendingAction?.payload.products?.[0].images?.[0]).toContain('unsplash')
      expect(result.cleanText).toContain('Do you confirm?')
      expect(result.cleanText).not.toContain('action_proposal')
    })

    it('recovers from unclosed action_proposal code blocks', () => {
      const truncatedText = `Here is the proposal:
\`\`\`action_proposal
{
  "type": "createProducts",
  "summary": "Sample Products",
  "payload": {
    "products": [
      {
        "name": "Bread Knife",
        "slug": "bread-knife",
        "price": 25.0
      }
    ]
  }
}`
      const result = extractActionProposal(truncatedText)
      expect(result.pendingAction?.type).toBe('createProducts')
      expect(result.pendingAction?.payload.products?.[0].name).toBe('Bread Knife')
    })

    it('returns null pendingAction when no action_proposal is present', () => {
      const text = 'Here are some catalog statistics: You have 150 products and 12 categories.'
      const result = extractActionProposal(text)
      expect(result.pendingAction).toBeNull()
      expect(result.cleanText).toBe(text)
    })
  })
})
