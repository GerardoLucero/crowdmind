import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PersonaProfile {
  name: string
  role: string
  yearsExperience: number
  industry: string
  bias: string
  perspective: string
}

export interface PersonaResult {
  index: number
  profile: PersonaProfile
  response: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
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
}

export const PROFILE_PRESETS: Record<string, { role: string; experience: string; industry: string; bias: string }> = {
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
  'ctors': {
    role: 'CTO or VP Engineering',
    experience: '8-20 years, last 3-5 in leadership',
    industry: 'Mix of Startups Series A-C, Scale-ups, Enterprise',
    bias: 'Business impact, technical strategy, team building, cost management',
  },
  'recruiters': {
    role: 'Technical Recruiter or Talent Partner',
    experience: '2-10 years in technical recruiting',
    industry: 'Mix of agencies, internal recruiting at tech companies',
    bias: 'Market fit, compensation benchmarks, candidate positioning',
  },
  'peers': {
    role: 'Senior Software Engineer or Solutions Architect',
    experience: '5-12 years in software engineering',
    industry: 'Mix of Fintech, SaaS, Cloud, DevOps',
    bias: 'Technical credibility, real-world problem solving, collaboration',
  },
  'investors': {
    role: 'Angel Investor or VC Partner',
    experience: '5-15 years investing in early-stage tech companies',
    industry: 'Mix of SaaS, Fintech, Dev Tools, AI/ML',
    bias: 'Market size, team credibility, defensibility, go-to-market',
  },
  'customers': {
    role: 'Potential Customer or End User',
    experience: '2-10 years using SaaS products in their domain',
    industry: 'Mix of SMB and Enterprise buyers',
    bias: 'ROI, ease of use, integration with existing tools, support quality',
  },
}

// ─── Step 1: Generate N distinct personas in one LLM call ──────────────────

export async function generatePersonas(
  n: number,
  profileConfig: { role: string; experience: string; industry: string; bias: string }
): Promise<PersonaProfile[]> {
  const { text } = await generateText({
    model: anthropic('claude-haiku-4.5'),
    system: 'You are a persona generation engine. Return only valid JSON arrays, no markdown.',
    prompt: `Generate exactly ${n} distinct realistic personas for the following profile.

PROFILE:
Role: ${profileConfig.role}
Experience: ${profileConfig.experience}
Industry: ${profileConfig.industry}
Bias/Context: ${profileConfig.bias}

Rules:
- Each persona must be unique (different name, background, industry, perspective)
- Make them realistic and varied — different seniorities, company types, geographies
- Include both optimistic and skeptical personalities
- Names should reflect international diversity

Return a JSON array of exactly ${n} objects with this structure (no markdown):
[
  {
    "name": "Full Name",
    "role": "Specific title and company type (e.g. 'Senior Engineering Manager at Series B Fintech')",
    "yearsExperience": 8,
    "industry": "Fintech",
    "bias": "One sentence describing their known bias or decision-making lens",
    "perspective": "One sentence framing how they view scenarios like this"
  }
]`,
    maxOutputTokens: 2000,
  })

  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean) as PersonaProfile[]
    return parsed.slice(0, n)
  } catch {
    return Array.from({ length: n }, (_, i) => ({
      name: `Persona ${i + 1}`,
      role: profileConfig.role,
      yearsExperience: 5 + (i % 10),
      industry: profileConfig.industry,
      bias: profileConfig.bias,
      perspective: 'Evaluates based on experience and market knowledge',
    }))
  }
}

// ─── Step 2: Run a single persona ─────────────────────────────────────────

export async function runPersona(
  persona: PersonaProfile,
  index: number,
  scenario: string
): Promise<PersonaResult> {
  const start = Date.now()

  try {
    const { text: rawResponse, usage } = await generateText({
      model: anthropic('claude-haiku-4.5'),
      system: `You are ${persona.name}, ${persona.role}.
You have ${persona.yearsExperience} years of experience in ${persona.industry}.
Your perspective: ${persona.perspective}
Your known lens/bias: ${persona.bias}

Respond ONLY as this person would — authentic to their background, in first person.
Be specific and honest. 3-5 sentences. Do not break character. Do not be generic.`,
      prompt: `Evaluate and react to the following:\n\n${scenario}`,
      maxOutputTokens: 400,
    })

    const tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)

    const { text: structuredText } = await generateText({
      model: anthropic('claude-haiku-4.5'),
      system: 'Extract sentiment and key points from text. Return only valid JSON, no markdown.',
      prompt: `Analyze this response and extract:
1. Overall sentiment: positive | neutral | negative | mixed
2. Key points: array of 2-3 specific points raised

Response to analyze:
"${rawResponse}"

Return JSON only (no markdown):
{"sentiment": "positive", "keyPoints": ["point 1", "point 2"]}`,
      maxOutputTokens: 200,
    })

    let sentiment: PersonaResult['sentiment'] = 'neutral'
    let keyPoints: string[] = []

    try {
      const clean = structuredText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(clean)
      sentiment = parsed.sentiment ?? 'neutral'
      keyPoints = parsed.keyPoints ?? []
    } catch { /* use defaults */ }

    return {
      index,
      profile: persona,
      response: rawResponse,
      sentiment,
      keyPoints,
      tokens,
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return {
      index,
      profile: persona,
      response: '',
      sentiment: 'neutral',
      keyPoints: [],
      tokens: 0,
      durationMs: Date.now() - start,
      error: String(err),
    }
  }
}

// ─── Step 3: Aggregate all results ────────────────────────────────────────

export async function aggregateResults(
  scenario: string,
  results: PersonaResult[]
): Promise<AggregationResult> {
  const successful = results.filter(r => !r.error && r.response)

  const breakdown = { positive: 0, neutral: 0, negative: 0, mixed: 0 }
  for (const r of successful) {
    breakdown[r.sentiment] = (breakdown[r.sentiment] ?? 0) + 1
  }

  const total = successful.length || 1
  const sentimentBreakdown = {
    positive: Math.round((breakdown.positive / total) * 100),
    neutral: Math.round((breakdown.neutral / total) * 100),
    negative: Math.round((breakdown.negative / total) * 100),
    mixed: Math.round((breakdown.mixed / total) * 100),
  }
  const consensusScore = sentimentBreakdown.positive + Math.round(sentimentBreakdown.mixed / 2)

  const sampleResponses = successful.slice(0, 15).map((r) =>
    `[${r.profile.role} — ${r.sentiment}]\n${r.response}`
  ).join('\n\n---\n\n')

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4.6'),
    system: 'You are an analyst synthesizing population simulation results. Return only valid JSON, no markdown.',
    prompt: `Synthesize these ${successful.length} responses to the following scenario.

SCENARIO: ${scenario}

SENTIMENT BREAKDOWN: ${sentimentBreakdown.positive}% positive, ${sentimentBreakdown.neutral}% neutral, ${sentimentBreakdown.negative}% negative, ${sentimentBreakdown.mixed}% mixed

SAMPLE RESPONSES (${Math.min(15, successful.length)} of ${successful.length}):
${sampleResponses}

Return JSON only (no markdown):
{
  "consensus": "2-3 sentence summary of the majority view",
  "dissent": "1-2 sentences about minority/contrarian views (if any)",
  "topPatterns": ["recurring theme 1", "recurring theme 2", "recurring theme 3"],
  "surprises": ["unexpected reaction or insight 1", "unexpected insight 2"],
  "recommendation": "Concrete actionable recommendation based on this population's reaction"
}`,
    maxOutputTokens: 600,
  })

  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    return {
      consensusScore,
      sentimentBreakdown,
      consensus: parsed.consensus ?? '',
      dissent: parsed.dissent ?? '',
      topPatterns: parsed.topPatterns ?? [],
      surprises: parsed.surprises ?? [],
      recommendation: parsed.recommendation ?? '',
    }
  } catch {
    return {
      consensusScore,
      sentimentBreakdown,
      consensus: `${sentimentBreakdown.positive}% of the population reacted positively.`,
      dissent: '',
      topPatterns: [],
      surprises: [],
      recommendation: 'Review individual responses for detailed insights.',
    }
  }
}
