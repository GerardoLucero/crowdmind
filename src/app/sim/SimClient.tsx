'use client'
import { useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface SimPersona {
  index: number
  profile: string   // JSON
  response: string
  sentiment: string
  keyPoints: string // JSON
  tokens: number
  durationMs: number
  error: string
}

interface SimRunSummary {
  id: string
  scenario: string
  n: number
  profileType: string
  status: string
  aggregation: string  // JSON
  callerType: string
  callerId: string
  totalTokens: number
  durationMs: number
  createdAt: string
  personas?: SimPersona[]
}

interface AggregationResult {
  consensusScore: number
  sentimentBreakdown: { positive: number; neutral: number; negative: number; mixed: number }
  consensus: string
  dissent: string
  topPatterns: string[]
  surprises: string[]
  recommendation: string
}

// ─── Presets ────────────────────────────────────────────────────────────────

const PRESET_LABELS: Record<string, { label: string; desc: string }> = {
  'hiring-managers': { label: 'Hiring Managers',  desc: 'Recruiters and technical managers' },
  'tech-leads':      { label: 'Tech Leads',        desc: 'Staff / Senior Engineers' },
  'ctors':           { label: 'CTOs / VPs Eng',    desc: 'Engineering leaders' },
  'recruiters':      { label: 'Recruiters',         desc: 'Technical recruiters' },
  'peers':           { label: 'Peers',              desc: 'Senior engineers & architects' },
  'investors':       { label: 'Investors',          desc: 'Angels and VCs' },
  'customers':       { label: 'Customers',          desc: 'Potential buyers and end users' },
}

// ─── Sentiment bar ──────────────────────────────────────────────────────────

function SentimentBar({ breakdown }: { breakdown: AggregationResult['sentimentBreakdown'] }) {
  const segments = [
    { key: 'positive' as const, color: '#22c55e', label: 'Positive' },
    { key: 'neutral'  as const, color: '#71717a', label: 'Neutral' },
    { key: 'mixed'    as const, color: '#eab308', label: 'Mixed' },
    { key: 'negative' as const, color: '#ef4444', label: 'Negative' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 9999, overflow: 'hidden', height: 12, marginBottom: 8 }}>
        {segments.map(s => breakdown[s.key] > 0 && (
          <div key={s.key} style={{ width: `${breakdown[s.key]}%`, background: s.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {segments.map(s => breakdown[s.key] > 0 && (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#71717a', fontFamily: 'monospace' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {breakdown[s.key]}% {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Persona card ────────────────────────────────────────────────────────────

function PersonaCard({ persona }: { persona: SimPersona }) {
  const [open, setOpen] = useState(false)
  const profile = JSON.parse(persona.profile)
  const keyPoints = JSON.parse(persona.keyPoints || '[]') as string[]
  const sentimentColor: Record<string, string> = {
    positive: '#22c55e', negative: '#ef4444',
    neutral: '#71717a', mixed: '#eab308',
  }

  return (
    <div style={{ border: '1px solid #27272a', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a', fontWeight: 700 }}>
            #{String(persona.index + 1).padStart(2, '0')}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 8px', borderRadius: 9999, color: sentimentColor[persona.sentiment] || '#71717a', background: '#18181b', border: `1px solid ${sentimentColor[persona.sentiment] || '#27272a'}` }}>
            {persona.sentiment}
          </span>
          <span style={{ color: '#71717a', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #27272a' }}>
          <p style={{ fontSize: 13, marginTop: 12, lineHeight: 1.6, color: '#d4d4d8' }}>
            {persona.response || <em style={{ color: '#71717a' }}>No response</em>}
          </p>
          {persona.error && (
            <p style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 8, color: '#ef4444' }}>Error: {persona.error}</p>
          )}
          {keyPoints.length > 0 && (
            <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {keyPoints.map((k, i) => (
                <li key={i} style={{ fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 8, color: '#71717a' }}>
                  <span style={{ color: '#6366f1' }}>→</span> {k}
                </li>
              ))}
            </ul>
          )}
          <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 12, color: '#3f3f46' }}>
            {persona.tokens} tokens · {persona.durationMs}ms
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Results panel ──────────────────────────────────────────────────────────

function ResultsPanel({ run }: { run: SimRunSummary }) {
  const agg = JSON.parse(run.aggregation) as AggregationResult
  if (!agg.consensusScore && !agg.consensus) return null

  const scoreColor = agg.consensusScore >= 70 ? '#22c55e' : agg.consensusScore >= 40 ? '#eab308' : '#ef4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consensus score</div>
            <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', color: scoreColor }}>{agg.consensusScore}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', marginBottom: 4 }}>{run.n} personas · {PRESET_LABELS[run.profileType]?.label ?? run.profileType}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{run.totalTokens.toLocaleString()} tokens · {(run.durationMs / 1000).toFixed(1)}s</div>
            {run.callerType === 'agent' && (
              <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4, padding: '2px 8px', borderRadius: 9999, display: 'inline-block', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                invoked by {run.callerId}
              </div>
            )}
          </div>
        </div>
        <SentimentBar breakdown={agg.sentimentBreakdown} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#22c55e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Majority view</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#d4d4d8' }}>{agg.consensus}</p>
        </div>
        {agg.dissent && (
          <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#eab308', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minority view</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#d4d4d8' }}>{agg.dissent}</p>
          </div>
        )}
      </div>

      {(agg.topPatterns?.length > 0 || agg.surprises?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {agg.topPatterns?.length > 0 && (
            <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurring patterns</div>
              <ol style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agg.topPatterns.map((p, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#d4d4d8' }}>
                    <span style={{ fontFamily: 'monospace', color: '#6366f1' }}>{i + 1}.</span> {p}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {agg.surprises?.length > 0 && (
            <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#f97316', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surprises / Outliers</div>
              <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agg.surprises.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#d4d4d8' }}>
                    <span style={{ color: '#f97316' }}>!</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {agg.recommendation && (
        <div style={{ border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: 16, background: 'rgba(99,102,241,0.05)' }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actionable recommendation</div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#d4d4d8' }}>{agg.recommendation}</p>
        </div>
      )}

      {run.personas && run.personas.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Individual responses ({run.personas.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {run.personas.map(p => <PersonaCard key={p.index} persona={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SimClient({ recentRuns }: { recentRuns: SimRunSummary[] }) {
  const [scenario, setScenario] = useState('')
  const [n, setN] = useState(10)
  const [profileType, setProfileType] = useState('hiring-managers')
  const [loading, setLoading] = useState(false)
  const [activeRun, setActiveRun] = useState<SimRunSummary | null>(null)
  const [runs, setRuns] = useState<SimRunSummary[]>(recentRuns)

  async function handleRun() {
    if (!scenario.trim() || loading) return
    setLoading(true)
    setActiveRun(null)
    try {
      const res = await fetch('/api/sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, n, profileType, callerType: 'user' }),
      })
      const data = await res.json()
      const fullRes = await fetch(`/api/sim?id=${data.id}`)
      const fullRun = await fullRes.json()
      setActiveRun(fullRun)
      setRuns(prev => [{ ...fullRun, personas: undefined }, ...prev.slice(0, 14)])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRun(id: string) {
    const res = await fetch(`/api/sim?id=${id}`)
    const data = await res.json()
    setActiveRun(data)
  }

  const card: React.CSSProperties = { border: '1px solid #27272a', borderRadius: 8, background: '#18181b' }
  const label: React.CSSProperties = { fontSize: 11, fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', margin: 0 }}>Persona Sim</h1>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#71717a', margin: '4px 0 0' }}>
          Simulate how a population of N personas would react to any scenario — invocable by agents via API
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={label}>New experiment</div>

            <div>
              <div style={{ ...label, display: 'block', marginBottom: 8 }}>Scenario</div>
              <textarea
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                rows={5}
                placeholder="E.g.: I am a senior software engineer with 8 years of experience in distributed systems and cloud architecture, looking for remote roles at international companies. How would they react?"
                style={{ width: '100%', fontSize: 13, borderRadius: 6, padding: '8px 12px', resize: 'none', background: '#09090b', border: '1px solid #27272a', color: '#d4d4d8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <div style={{ ...label, display: 'block', marginBottom: 8 }}>
                Population: <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{n} personas</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 20, 30].map(v => (
                  <button key={v} onClick={() => setN(v)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: n === v ? '#6366f1' : '#09090b', color: n === v ? '#fff' : '#71717a', border: `1px solid ${n === v ? '#6366f1' : '#27272a'}` }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ ...label, display: 'block', marginBottom: 8 }}>Population profile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(PRESET_LABELS).map(([key, p]) => (
                  <button key={key} onClick={() => setProfileType(key)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', background: profileType === key ? 'rgba(99,102,241,0.1)' : '#09090b', border: `1px solid ${profileType === key ? '#6366f1' : '#27272a'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: profileType === key ? '#818cf8' : '#fafafa' }}>{p.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={!scenario.trim() || loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: loading || !scenario.trim() ? 'not-allowed' : 'pointer', background: loading || !scenario.trim() ? '#27272a' : '#6366f1', color: loading || !scenario.trim() ? '#71717a' : '#fff', border: 'none', transition: 'all 0.15s' }}>
              {loading ? `Simulating ${n} personas...` : 'Run simulation'}
            </button>
          </div>

          {runs.length > 0 && (
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...label, marginBottom: 12 }}>Recent simulations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {runs.map(r => {
                  const agg = (() => { try { return JSON.parse(r.aggregation) as AggregationResult } catch { return null } })()
                  const scoreColor = agg ? (agg.consensusScore >= 70 ? '#22c55e' : agg.consensusScore >= 40 ? '#eab308' : '#ef4444') : '#71717a'
                  return (
                    <button key={r.id} onClick={() => loadRun(r.id)}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6, cursor: 'pointer', background: activeRun?.id === r.id ? 'rgba(99,102,241,0.1)' : '#09090b', border: `1px solid ${activeRun?.id === r.id ? '#6366f1' : '#27272a'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: scoreColor }}>{agg ? `${agg.consensusScore}%` : r.status} · {r.n}p</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#3f3f46' }}>{new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.scenario.slice(0, 60)}{r.scenario.length > 60 ? '…' : ''}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          {loading && (
            <div style={{ ...card, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>...</div>
              <div style={{ fontSize: 13, color: '#71717a' }}>Simulating {n} personas in parallel...</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#3f3f46' }}>Generating profiles → executing → aggregating results</div>
            </div>
          )}
          {!loading && activeRun && <ResultsPanel run={activeRun} />}
          {!loading && !activeRun && (
            <div style={{ ...card, padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32, color: '#27272a' }}>[ ]</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#71717a' }}>No active simulation</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 300, color: '#3f3f46' }}>
                Describe a scenario, choose a population, and run to see how N synthetic personas react
              </div>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 6, textAlign: 'left', maxWidth: 340, background: '#09090b', border: '1px solid #27272a' }}>
                <div style={{ ...label, marginBottom: 8 }}>Also invocable by agents</div>
                <pre style={{ fontFamily: 'monospace', fontSize: 11, color: '#f97316', margin: 0, whiteSpace: 'pre' }}>{`POST /api/sim\n{ scenario, n, profileType,\n  callerType: "agent",\n  callerId: "career-strategist" }`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
