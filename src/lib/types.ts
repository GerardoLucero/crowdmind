import type { AggregationResult, PersonaResult } from './sim-engine'

/** A finished simulation as the client keeps it (stateless server: nothing is stored there). */
export interface Run {
  id: string
  scenario: string
  n: number
  profileType: string
  callerType: 'user' | 'agent'
  callerId: string
  aggregation: AggregationResult
  results: PersonaResult[]
  successCount: number
  totalTokens: number
  durationMs: number
  createdAt: string
  /** True for the precomputed example: no model was called. */
  sample?: boolean
}
