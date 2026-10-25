import { z } from 'zod'
import { ModelProvider } from './model-provider'
import { fence } from './fence'

const model = new ModelProvider()

// ─── Types ─────────────────────────────────────────────────────────────────

export const PersonaProfileSchema = z.object({
  name: z.string().max(80),
  role: z.string().max(120),
  yearsExperience: z.number(),
  industry: z.string().max(80),
  bias: z.string().max(240),
  perspective: z.string().max(240),
})
export type PersonaProfile = z.infer<typeof PersonaProfileSchema>

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed'

export interface PersonaResult {
  index: number
  profile: PersonaProfile
  response: string
  sentiment: Sentiment
  keyPoints: string[]
  tokens: number
  durationMs: number
  error?: string
}

export interface AggregationResult {
  consensusScore: number
  sentimentBreakdown: { positive: number; neutral: number; negative: number; mixed: number }
  consensus: string
  dissent: string
  topPatterns: string[]
  surprises: string[]
  recommendation: string
  /** True when the synthesis step failed and only the sentiment numbers are real. */
  degraded?: boolean
}

export interface ProfileConfig {
  role: string
  experience: string
  industry: string
  bias: string
}

export const PROFILE_PRESETS: Record<string, ProfileConfig> = {
  'hiring-managers': {
    role: 'Hiring Manager or Technical Recruiter',
    experience: '3-12 years in talent acquisition or engineering management',
    industry: 'Mix of Tech (SaaS, Fintech, Startup, Enterprise)',
    bias: 'Evaluating candidates for senior technical roles in international companies',
  },
  'tech-leads': {
    role: 'Tech Lead or Staff Engineer',
    experience: '5-15 years of software engineering',
    industry: 'Mix of Fintech, SaaS, Startups, Enterprise Tech',
    bias: 'Technical depth, architecture decisions, team dynamics',
  },
  ctors: {
    role: 'CTO or VP Engineering',
    experience: '8-20 years, last 3-5 in leadership',
    industry: 'Mix of Startups Series A-C, Scale-ups, Enterprise',
    bias: 'Business impact, technical strategy, team building, cost management',
  },
  recruiters: {
    role: 'Technical Recruiter or Talent Partner',
    experience: '2-10 years in technical recruiting',
    industry: 'Mix of agencies, internal recruiting at tech companies',
    bias: 'Market fit, compensation benchmarks, candidate positioning',
  },
  peers: {
    role: 'Senior Software Engineer or Solutions Architect',
    experience: '5-12 years in software engineering',
    industry: 'Mix of Fintech, SaaS, Cloud, DevOps',
    bias: 'Technical credibility, real-world problem solving, collaboration',
  },
  investors: {
    role: 'Angel Investor or VC Partner',
    experience: '5-15 years investing in early-stage tech companies',
    industry: 'Mix of SaaS, Fintech, Dev Tools, AI/ML',
    bias: 'Market size, team credibility, defensibility, go-to-market',
  },
  customers: {
    role: 'Potential Customer or End User',
    experience: '2-10 years using SaaS products in their domain',
    industry: 'Mix of SMB and Enterprise buyers',
    bias: 'ROI, ease of use, integration with existing tools, support quality',
  },
}

// ─── Step 1: Generate N distinct personas in one call ───────────────────────

export async function generatePersonas(n: number, profile: ProfileConfig): Promise<PersonaProfile[]> {
  try {
    const { data } = await model.generateJson(
      {
        systemPrompt: 'You are a persona generation engine.',
        messages: [
          {
            role: 'user',
            content: `Generate exactly ${n} distinct realistic personas for the following profile.

PROFILE:
Role: ${profile.role}
Experience: ${profile.experience}
Industry: ${profile.industry}
Bias/Context: ${profile.bias}

Rules:
- Each persona must be unique (different name, background, industry, perspective)
- Different seniorities, company types and geographies; international names
- Include both optimistic and skeptical personalities

Return a JSON object {"personas": [...]} with exactly ${n} items shaped like:
{"name":"Full Name","role":"Specific title and company type","yearsExperience":8,"industry":"Fintech","bias":"One sentence decision-making lens","perspective":"One sentence on how they view scenarios like this"}`,
          },
        ],
        maxTokens: 2500,
      },
      z.object({ personas: PersonaProfileSchema.array().min(1) })
    )
    return data.personas.slice(0, n)
  } catch (err) {
    console.warn('[sim] persona generation failed, using generic personas:', err instanceof Error ? err.message.slice(0, 120) : 'error')
    return Array.from({ length: n }, (_, i) => ({
      name: `Persona ${i + 1}`,
      role: profile.role,
      yearsExperience: 5 + (i % 10),
      industry: profile.industry,
      bias: profile.bias,
      perspective: 'Evaluates based on experience and market knowledge',
    }))
  }
}

// ─── Step 2: One call per persona (reaction + sentiment + key points) ───────

const ReactionSchema = z.object({
  response: z.string().min(1).max(1500),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  keyPoints: z.array(z.string().max(240)).max(5),
})

export async function runPersona(persona: PersonaProfile, index: number, scenario: string): Promise<PersonaResult> {
  const start = Date.now()
  try {
    const { data, meta } = await model.generateJson(
      {
        systemPrompt: `You are ${persona.name}, ${persona.role}.
You have ${persona.yearsExperience} years of experience in ${persona.industry}.
Your perspective: ${persona.perspective}
Your known lens/bias: ${persona.bias}

Respond only as this person would: authentic to their background, first person, specific and honest, not generic. Write in the language of the scenario.`,
        messages: [
          {
            role: 'user',
            content: `React to the following scenario.

${fence('scenario', scenario, 4000)}

Return JSON only:
{"response":"3-5 sentence reaction in first person","sentiment":"positive | neutral | negative | mixed","keyPoints":["2-3 specific points you raise"]}`,
          },
        ],
        maxTokens: 900,
      },
      ReactionSchema
    )
    return { index, profile: persona, ...data, tokens: meta.tokens, durationMs: Date.now() - start }
  } catch (err) {
    // Provider and parser errors can quote the scenario, so only a generic label leaves the server.
    console.warn(`[sim] persona ${index} failed:`, err instanceof Error ? err.message.slice(0, 120) : 'error')
    return {
      index, profile: persona, response: '', sentiment: 'neutral', keyPoints: [],
      tokens: 0, durationMs: Date.now() - start, error: 'model unavailable',
    }
  }
}

// ─── Step 3: Aggregate ──────────────────────────────────────────────────────

const SynthesisSchema = z.object({
  consensus: z.string().max(800),
  dissent: z.string().max(600),
  topPatterns: z.array(z.string().max(240)).max(5),
  surprises: z.array(z.string().max(240)).max(5),
  recommendation: z.string().max(800),
})

export function sentimentStats(results: PersonaResult[]) {
  const ok = results.filter((r) => !r.error && r.response)
  const count = { positive: 0, neutral: 0, negative: 0, mixed: 0 }
  for (const r of ok) count[r.sentiment] += 1
  const total = ok.length || 1
  const sentimentBreakdown = {
    positive: Math.round((count.positive / total) * 100),
    neutral: Math.round((count.neutral / total) * 100),
    negative: Math.round((count.negative / total) * 100),
    mixed: Math.round((count.mixed / total) * 100),
  }
  // Mixed reactions count half: the score is "how much of the group leans in".
  const consensusScore = sentimentBreakdown.positive + Math.round(sentimentBreakdown.mixed / 2)
  return { ok, sentimentBreakdown, consensusScore }
}

export async function aggregateResults(scenario: string, results: PersonaResult[]): Promise<AggregationResult & { tokens: number }> {
  const { ok, sentimentBreakdown, consensusScore } = sentimentStats(results)
  const samples = ok.slice(0, 12).map((r) => `[${r.profile.role} | ${r.sentiment}]\n${fence('response', r.response, 600)}`).join('\n\n')
  try {
    const { data, meta } = await model.generateJson(
      {
        systemPrompt: 'You are an analyst synthesizing the reactions of a simulated group of people.',
        messages: [
          {
            role: 'user',
            content: `Synthesize these ${ok.length} reactions to the scenario.

${fence('scenario', scenario, 4000)}

SENTIMENT: ${sentimentBreakdown.positive}% positive, ${sentimentBreakdown.neutral}% neutral, ${sentimentBreakdown.negative}% negative, ${sentimentBreakdown.mixed}% mixed

REACTIONS:
${samples}

Return JSON only, in the language of the scenario:
{"consensus":"2-3 sentence summary of the majority view","dissent":"1-2 sentences on minority views","topPatterns":["3 recurring themes"],"surprises":["1-2 unexpected insights"],"recommendation":"concrete, actionable next step"}`,
          },
        ],
        maxTokens: 1500,
      },
      SynthesisSchema
    )
    return { consensusScore, sentimentBreakdown, ...data, tokens: meta.tokens }
  } catch (err) {
    console.warn('[sim] synthesis failed:', err instanceof Error ? err.message.slice(0, 120) : 'error')
    return {
      degraded: true, tokens: 0, consensusScore, sentimentBreakdown,
      consensus: `${sentimentBreakdown.positive}% of the group reacted positively.`,
      dissent: '', topPatterns: [], surprises: [],
      recommendation: 'The written synthesis could not be generated. Read the individual reactions.',
    }
  }
}
