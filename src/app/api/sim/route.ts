import { z } from 'zod'
import { LIMITS } from '@/lib/limits'
import { plain } from '@/lib/fence'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { PROFILE_PRESETS } from '@/lib/sim-engine'
import { runSimulation, SimUnavailableError } from '@/lib/run-sim'

export const maxDuration = 120

// Each run is 1 + N + 1 model calls, so it is capped per IP (best effort, per instance).
const RUNS_PER_WINDOW = 6
const WINDOW_MS = 30 * 60 * 1000

const customField = z.string().trim().min(1).max(LIMITS.customField)
const BodySchema = z.object({
  scenario: z.string().trim().min(1, 'scenario is required').max(LIMITS.scenario, `scenario admits up to ${LIMITS.scenario} characters`),
  n: z.number().int().optional(),
  profileType: z.string().optional(),
  profileConfig: z.object({ role: customField, experience: customField, industry: customField, bias: customField }).optional(),
  callerType: z.enum(['user', 'agent']).default('user'),
  callerId: z.string().max(60).default(''),
  /** false returns one JSON document instead of an event stream; meant for agents. */
  stream: z.boolean().default(true),
})

const json = (body: object, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

const hasProvider = () => Boolean(process.env.GROQ_API_KEY || process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY)

export async function POST(request: Request) {
  const rl = rateLimit(`sim:${clientIp(request)}`, RUNS_PER_WINDOW, WINDOW_MS)
  if (!rl.ok) return json({ error: 'Too many runs. Try again later.' }, 429, { 'Retry-After': String(rl.retryAfterSec) })

  if (Number(request.headers.get('content-length') ?? 0) > LIMITS.maxBodyBytes) return json({ error: 'Request too large.' }, 413)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return json({ error: 'Body must be valid JSON.' }, 400)
  }
  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, 400)
  const body = parsed.data

  if (!hasProvider()) {
    return json({ error: 'No model provider is configured on this server. Try the precomputed example.', code: 'no_provider' }, 503)
  }

  const profileType = body.profileType ?? 'hiring-managers'
  const preset = PROFILE_PRESETS[profileType]
  if (!body.profileConfig && !preset) return json({ error: `Unknown profileType. Use one of: ${Object.keys(PROFILE_PRESETS).join(', ')}` }, 400)
  const profile = body.profileConfig
    ? {
        role: plain(body.profileConfig.role, LIMITS.customField),
        experience: plain(body.profileConfig.experience, LIMITS.customField),
        industry: plain(body.profileConfig.industry, LIMITS.customField),
        bias: plain(body.profileConfig.bias, LIMITS.customField),
      }
    : preset
  const n = Math.min(Math.max(body.n ?? LIMITS.defaultN, LIMITS.minN), LIMITS.maxN)
  const meta = { id: `sim-${Date.now()}`, scenario: body.scenario, n, profileType: body.profileConfig ? 'custom' : profileType, callerType: body.callerType, callerId: plain(body.callerId, 60) }
  const params = { scenario: body.scenario, n, profile }

  const failure = (err: unknown) => {
    console.error('[sim] error', err instanceof Error ? err.message.slice(0, 200) : 'unknown')
    return err instanceof SimUnavailableError
      ? 'The AI providers are not answering right now. Try again in a few minutes.'
      : 'The simulation could not be completed. Try again.'
  }

  if (!body.stream) {
    try {
      const summary = await runSimulation(params)
      return json({ ...meta, ...summary }, 200)
    } catch (err) {
      return json({ error: failure(err) }, 503)
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      try {
        emit({ type: 'start', ...meta })
        const summary = await runSimulation(params, (event) => emit(event))
        emit({ type: 'complete', ...meta, ...summary })
      } catch (err) {
        emit({ type: 'error', error: failure(err) })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}
