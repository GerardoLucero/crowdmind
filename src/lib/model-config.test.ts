import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getModelConfig, resetModelConfigCache } from './model-config'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('getModelConfig', () => {
  beforeEach(() => {
    resetModelConfigCache()
    vi.stubEnv('NODE_ENV', 'production')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('uses the remote list when valid and caches it', async () => {
    const f = vi.fn(async () => json({ groq: ['a/b'], nim: ['c/d'] }))
    expect(await getModelConfig(f as unknown as typeof fetch)).toEqual({ groq: ['a/b'], nim: ['c/d'] })
    await getModelConfig(f as unknown as typeof fetch)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('falls back to the bundled copy when the remote is down', async () => {
    const cfg = await getModelConfig((async () => json({}, 500)) as unknown as typeof fetch)
    expect(cfg.groq.length).toBeGreaterThan(0)
  })
})
