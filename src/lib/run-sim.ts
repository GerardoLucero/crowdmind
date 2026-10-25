import {
  aggregateResults,
  generatePersonas,
  runPersona,
  sentimentStats,
  type AggregationResult,
  type PersonaProfile,
  type PersonaResult,
  type ProfileConfig,
} from './sim-engine'

export interface SimParams {
  scenario: string
  n: number
  profile: ProfileConfig
}

export interface SimSummary {
  aggregation: AggregationResult
  results: PersonaResult[]
  successCount: number
  totalTokens: number
  durationMs: number
}

export type SimEvent =
  | { type: 'personas'; personas: PersonaProfile[] }
  | { type: 'persona'; result: PersonaResult; done: number; total: number }

/** Free tiers cap tokens per minute, so personas run a few at a time instead of all at once. */
const CONCURRENCY = 4

export async function runSimulation(params: SimParams, emit: (event: SimEvent) => void = () => {}): Promise<SimSummary> {
  const start = Date.now()
  const personas = await generatePersonas(params.n, params.profile)
  emit({ type: 'personas', personas })

  const results: PersonaResult[] = []
  let next = 0
  const worker = async () => {
    while (next < personas.length) {
      const i = next++
      const result = await runPersona(personas[i], i, params.scenario)
      results.push(result)
      emit({ type: 'persona', result, done: results.length, total: personas.length })
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, personas.length) }, worker))
  results.sort((a, b) => a.index - b.index)

  const { ok } = sentimentStats(results)
  if (ok.length === 0) throw new SimUnavailableError()

  const { tokens: synthesisTokens, ...aggregation } = await aggregateResults(params.scenario, results)
  return {
    aggregation,
    results,
    successCount: ok.length,
    totalTokens: results.reduce((s, r) => s + r.tokens, 0) + synthesisTokens,
    durationMs: Date.now() - start,
  }
}

/** Every persona call failed: the model providers are down or out of quota. */
export class SimUnavailableError extends Error {
  constructor() {
    super('No persona produced a usable reaction.')
  }
}
