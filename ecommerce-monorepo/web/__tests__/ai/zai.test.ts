import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getZaiChatEndpoint,
  formatZaiErrorMessage,
  callZaiChatCompletion,
  ZAI_ENDPOINTS,
  DEFAULT_ZAI_MODEL,
} from '@/lib/ai/providers/zai'

describe('Z.ai (GLM) Provider Adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('formats endpoints correctly', () => {
    expect(getZaiChatEndpoint(ZAI_ENDPOINTS.international)).toBe(
      'https://api.z.ai/api/paas/v4/chat/completions'
    )
    expect(getZaiChatEndpoint(ZAI_ENDPOINTS.china)).toBe(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    )
    expect(getZaiChatEndpoint('https://api.z.ai/api/paas/v4/chat/completions')).toBe(
      'https://api.z.ai/api/paas/v4/chat/completions'
    )
  })

  it('formats user-friendly error message with required structure', () => {
    const msg = formatZaiErrorMessage(401, 'Unauthorized')
    expect(msg).toContain('Z.ai returned HTTP 401')
    expect(msg).toContain('Check your API key in Admin > Settings > System')
    expect(msg).toContain('Free models: glm-4.7-flash, glm-4.5-flash')
  })

  it('rejects call when API key is missing', async () => {
    await expect(
      callZaiChatCompletion({
        apiKey: '',
        messages: [{ role: 'user', content: 'hello' }],
      })
    ).rejects.toThrow('Z.ai API key is missing')
  })

  it('successfully returns response on valid completion', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Hello! I am GLM.',
            },
          },
        ],
      }),
    })
    global.fetch = mockFetch

    const result = await callZaiChatCompletion({
      apiKey: 'test-key',
      model: DEFAULT_ZAI_MODEL,
      messages: [{ role: 'user', content: 'hello' }],
    })

    expect(result.content).toBe('Hello! I am GLM.')
    expect(result.modelUsed).toBe('glm-4.7-flash')
    expect(result.provider).toBe('Z.ai (GLM)')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('formats error message when non-200 status is returned', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'Invalid token' } }),
      headers: new Headers(),
    })
    global.fetch = mockFetch

    await expect(
      callZaiChatCompletion({
        apiKey: 'invalid-key',
        messages: [{ role: 'user', content: 'hello' }],
        maxRetries: 0,
      })
    ).rejects.toThrow(/Z\.ai returned HTTP 401/)
  })
})
