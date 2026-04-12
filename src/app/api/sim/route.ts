import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generatePersonas,
  runPersona,
  aggregateResults,
  PROFILE_PRESETS,
} from '@/lib/sim-engine'

export const maxDuration = 120

// ─── POST /api/sim ─────────────────────────────────────────────────────────
// Invocable by:
//   - Human user from UI (callerType: "user")
//   - AI agents in your system (callerType: "agent", callerId: agentId)
//
// Body: { scenario, n, profileType, profileConfig?, callerType?, callerId? }
// ──────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json() as {
    scenario: string
    n?: number
    profileType?: string
    profileConfig?: { role: string; experience: string; industry: string; bias: string }
    callerType?: 'user' | 'agent'
    callerId?: string
  }

  const { scenario, callerType = 'user', callerId = '' } = body
  if (!scenario?.trim()) {
    return NextResponse.json({ error: 'scenario is required' }, { status: 400 })
  }

  const safeN = Math.min(Math.max(body.n ?? 10, 3), 30)
  const profileType = body.profileType ?? 'hiring-managers'
  const profileConfig = body.profileConfig ?? PROFILE_PRESETS[profileType] ?? PROFILE_PRESETS['hiring-managers']

  const simId = `sim-${Date.now()}`
  const globalStart = Date.now()

  await prisma.simRun.create({
    data: {
      id: simId,
      scenario,
      n: safeN,
      profileType,
      profileConfig: JSON.stringify(profileConfig),
      status: 'running',
      callerType,
      callerId,
    },
  })

  try {
    // Step 1 — Generate N personas in one LLM call
    const personas = await generatePersonas(safeN, profileConfig)

    // Step 2 — Run all personas in parallel
    const settled = await Promise.allSettled(
      personas.map((p, i) => runPersona(p, i, scenario))
    )

    const results = settled.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            index: i,
            profile: personas[i],
            response: '',
            sentiment: 'neutral' as const,
            keyPoints: [],
            tokens: 0,
            durationMs: 0,
            error: (r as PromiseRejectedResult).reason?.message ?? 'unknown error',
          }
    )

    // Step 3 — Aggregate results
    const successful = results.filter(r => !r.error && r.response)
    const aggregation = await aggregateResults(scenario, successful)

    await prisma.simPersona.createMany({
      data: results.map(r => ({
        simRunId: simId,
        index: r.index,
        profile: JSON.stringify(r.profile),
        response: r.response,
        sentiment: r.sentiment,
        keyPoints: JSON.stringify(r.keyPoints),
        tokens: r.tokens,
        durationMs: r.durationMs,
        error: r.error ?? '',
      })),
    })

    const totalTokens = results.reduce((s, r) => s + r.tokens, 0)
    const durationMs = Date.now() - globalStart

    await prisma.simRun.update({
      where: { id: simId },
      data: {
        status: 'done',
        aggregation: JSON.stringify(aggregation),
        totalTokens,
        durationMs,
      },
    })

    return NextResponse.json({
      id: simId,
      scenario,
      n: safeN,
      profileType,
      callerType,
      callerId,
      aggregation,
      personaCount: results.length,
      successCount: successful.length,
      totalTokens,
      durationMs,
    })
  } catch (err) {
    await prisma.simRun.update({
      where: { id: simId },
      data: { status: 'error', aggregation: JSON.stringify({ error: String(err) }) },
    })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── GET /api/sim?id=sim-xxx ───────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = await Promise.resolve(new URL(request.url))
  const id = searchParams.get('id')

  if (id) {
    const run = await prisma.simRun.findUnique({
      where: { id },
      include: { personas: { orderBy: { index: 'asc' } } },
    })
    if (!run) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json(run)
  }

  const runs = await prisma.simRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, scenario: true, n: true, profileType: true,
      status: true, aggregation: true, callerType: true, callerId: true,
      totalTokens: true, durationMs: true, createdAt: true,
    },
  })
  return NextResponse.json(runs)
}
