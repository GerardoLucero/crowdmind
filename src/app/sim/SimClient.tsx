'use client'
import { useEffect, useState } from 'react'
import { EXAMPLE_SCENARIOS, SAMPLE_RUN } from '@/lib/sample'
import type { Run } from '@/lib/types'
import type { AggregationResult, PersonaProfile, PersonaResult } from '@/lib/sim-engine'

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

function PersonaCard({ persona }: { persona: PersonaResult }) {
  const [open, setOpen] = useState(false)
  const profile = persona.profile
  const keyPoints = persona.keyPoints
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
            <p style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 8, color: '#ef4444' }}>This persona could not answer ({persona.error}).</p>
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
          {persona.tokens > 0 && (
            <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 12, color: '#3f3f46' }}>
              {persona.tokens} tokens · {persona.durationMs}ms
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Results panel ──────────────────────────────────────────────────────────

function ResultsPanel({ run }: { run: Run }) {
  const agg = run.aggregation

  const scoreColor = agg.consensusScore >= 70 ? '#22c55e' : agg.consensusScore >= 40 ? '#eab308' : '#ef4444'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {agg.degraded && (
        <div role="status" style={{ border: '1px solid #eab308', borderRadius: 8, padding: 12, fontSize: 12, color: '#eab308' }}>
          The written synthesis could not be generated; only the sentiment numbers and individual reactions are shown.
        </div>
      )}
      <div style={{ border: '1px solid #27272a', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consensus score</div>
            <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'monospace', color: scoreColor }}>{agg.consensusScore}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', marginBottom: 4 }}>{run.n} personas · {PRESET_LABELS[run.profileType]?.label ?? run.profileType}</div>
            {run.sample ? (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#eab308' }}>Precomputed example, no model was called</div>
            ) : (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{run.totalTokens.toLocaleString()} tokens · {(run.durationMs / 1000).toFixed(1)}s</div>
            )}
            {run.callerType === 'agent' && (
              <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4, padding: '2px 8px', borderRadius: 9999, display: 'inline-block', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                invoked by {run.callerId}
              </div>
            )}
          </div>
        </div>
        <SentimentBar breakdown={agg.sentimentBreakdown} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
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

      {run.results.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Individual responses ({run.results.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {run.results.map(p => <PersonaCard key={p.index} persona={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

const HISTORY_KEY = 'crowdmind:history:v1'
const HISTORY_MAX = 8

function loadHistory(): Run[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as Run[]) : []
  } catch {
    return []
  }
}

function saveHistory(runs: Run[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(0, HISTORY_MAX)))
  } catch {
    // Private mode or full storage: history is a convenience, not required.
  }
}

interface Progress { personas: PersonaProfile[]; done: number; total: number; live: PersonaResult[] }

export function SimClient() {
  const [scenario, setScenario] = useState('')
  const [n, setN] = useState(8)
  const [profileType, setProfileType] = useState('hiring-managers')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [error, setError] = useState<{ message: string; noProvider: boolean } | null>(null)
  const [activeRun, setActiveRun] = useState<Run | null>(null)
  const [runs, setRuns] = useState<Run[]>([])

  useEffect(() => { setRuns(loadHistory()) }, [])

  function remember(run: Run) {
    setRuns(prev => {
      const next = [run, ...prev.filter(r => r.id !== run.id)].slice(0, HISTORY_MAX)
      saveHistory(next)
      return next
    })
  }

  async function handleRun() {
    if (!scenario.trim() || loading) return
    setLoading(true)
    setActiveRun(null)
    setError(null)
    setProgress({ personas: [], done: 0, total: n, live: [] })
    try {
      const res = await fetch('/api/sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, n, profileType, callerType: 'user' }),
      })
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}))
        setError({ message: body.error ?? 'The simulation could not start.', noProvider: body.code === 'no_provider' })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let event: any
          try { event = JSON.parse(line.slice(6)) } catch { continue }
          if (event.type === 'personas') setProgress(p => p && { ...p, personas: event.personas, total: event.personas.length })
          else if (event.type === 'persona') setProgress(p => p && { ...p, done: event.done, total: event.total, live: [...p.live, event.result] })
          else if (event.type === 'complete') {
            const run: Run = { ...event, createdAt: new Date().toISOString() }
            delete (run as { type?: string }).type
            setActiveRun(run)
            remember(run)
          } else if (event.type === 'error') setError({ message: event.error, noProvider: false })
        }
      }
    } catch {
      setError({ message: 'Network error. Check your connection and try again.', noProvider: false })
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  function useExample(i: number) {
    const ex = EXAMPLE_SCENARIOS[i]
    setScenario(ex.text)
    setProfileType(ex.profileType)
    setError(null)
  }

  const card: React.CSSProperties = { border: '1px solid #27272a', borderRadius: 8, background: '#18181b' }
  const label: React.CSSProperties = { fontSize: 11, fontFamily: 'monospace', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const chip: React.CSSProperties = { padding: '4px 10px', borderRadius: 9999, fontSize: 12, cursor: 'pointer', background: '#09090b', color: '#a1a1aa', border: '1px solid #27272a' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', margin: 0 }}>Crowdmind</h1>
        <p style={{ fontSize: 13, color: '#a1a1aa', margin: '4px 0 0' }}>
          An AI focus group in under a minute: describe a CV, pitch or product copy and see how a panel of simulated people reacts.
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', margin: '8px 0 0' }}>
          Personas are generated by a language model. Treat the output as a rehearsal, not as market research.
        </p>
      </div>

      <div className="layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={label}>New experiment</div>

            <div>
              <label htmlFor="scenario" style={{ ...label, display: 'block', marginBottom: 8 }}>Scenario</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {EXAMPLE_SCENARIOS.map((ex, i) => (
                  <button key={ex.label} type="button" onClick={() => useExample(i)} style={chip}>{ex.label}</button>
                ))}
              </div>
              <textarea
                id="scenario"
                value={scenario}
                maxLength={4000}
                onChange={e => setScenario(e.target.value)}
                rows={6}
                placeholder="Paste your CV summary, pitch or copy, or pick an example above."
                style={{ width: '100%', fontSize: 13, borderRadius: 6, padding: '8px 12px', resize: 'vertical', background: '#09090b', border: '1px solid #27272a', color: '#d4d4d8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <div style={{ ...label, display: 'block', marginBottom: 8 }}>
                Panel size: <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{n} personas</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[4, 8, 12].map(v => (
                  <button key={v} type="button" onClick={() => setN(v)} aria-pressed={n === v}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontFamily: 'monospace', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: n === v ? '#6366f1' : '#09090b', color: n === v ? '#fff' : '#a1a1aa', border: `1px solid ${n === v ? '#6366f1' : '#27272a'}` }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ ...label, display: 'block', marginBottom: 8 }}>Who is in the panel</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(PRESET_LABELS).map(([key, p]) => (
                  <button key={key} type="button" onClick={() => setProfileType(key)} aria-pressed={profileType === key}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, textAlign: 'left', cursor: 'pointer', background: profileType === key ? 'rgba(99,102,241,0.1)' : '#09090b', border: `1px solid ${profileType === key ? '#6366f1' : '#27272a'}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: profileType === key ? '#818cf8' : '#fafafa' }}>{p.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#a1a1aa' }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={!scenario.trim() || loading}
              style={{ width: '100%', padding: '12px 0', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: loading || !scenario.trim() ? 'not-allowed' : 'pointer', background: loading || !scenario.trim() ? '#27272a' : '#6366f1', color: loading || !scenario.trim() ? '#a1a1aa' : '#fff', border: 'none' }}>
              {loading ? `Simulating ${n} personas...` : 'Run simulation'}
            </button>
            <button type="button" onClick={() => { setActiveRun(SAMPLE_RUN); setError(null) }} style={{ ...chip, width: '100%', borderRadius: 6, padding: '8px 0' }}>
              See a precomputed example (no model call)
            </button>
          </div>

          {runs.length > 0 && (
            <div style={{ ...card, padding: 16 }}>
              <div style={{ ...label, marginBottom: 12 }}>Recent simulations (this browser)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {runs.map(r => {
                  const scoreColor = r.aggregation.consensusScore >= 70 ? '#22c55e' : r.aggregation.consensusScore >= 40 ? '#eab308' : '#ef4444'
                  return (
                    <button key={r.id} type="button" onClick={() => { setActiveRun(r); setError(null) }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 6, cursor: 'pointer', background: activeRun?.id === r.id ? 'rgba(99,102,241,0.1)' : '#09090b', border: `1px solid ${activeRun?.id === r.id ? '#6366f1' : '#27272a'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: scoreColor }}>{r.aggregation.consensusScore}% · {r.n}p</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a' }}>{new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.scenario.slice(0, 60)}{r.scenario.length > 60 ? '…' : ''}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div aria-live="polite">
          {error && (
            <div role="alert" style={{ ...card, padding: 16, marginBottom: 16, borderColor: '#ef4444' }}>
              <div style={{ fontSize: 13, color: '#fca5a5' }}>{error.message}</div>
              {error.noProvider && (
                <button type="button" onClick={() => { setActiveRun(SAMPLE_RUN); setError(null) }} style={{ ...chip, marginTop: 12 }}>
                  Show the precomputed example
                </button>
              )}
            </div>
          )}
          {loading && progress && (
            <div style={{ ...card, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: '#d4d4d8' }}>
                {progress.personas.length === 0 ? 'Building the panel...' : `${progress.done} of ${progress.total} personas have answered`}
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: '#27272a', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: '#6366f1', transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {progress.live.map(r => <PersonaCard key={r.index} persona={r} />)}
              </div>
            </div>
          )}
          {!loading && activeRun && <ResultsPanel run={activeRun} />}
          {!loading && !activeRun && !error && (
            <div style={{ ...card, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#d4d4d8' }}>No simulation yet</div>
              <div style={{ fontSize: 12, maxWidth: 340, color: '#a1a1aa' }}>
                Pick an example scenario, choose who is in the panel and run it. Or open the precomputed example to see what a result looks like.
              </div>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 6, textAlign: 'left', maxWidth: 360, background: '#09090b', border: '1px solid #27272a' }}>
                <div style={{ ...label, marginBottom: 8 }}>Also available as an API</div>
                <pre style={{ fontFamily: 'monospace', fontSize: 11, color: '#f97316', margin: 0, whiteSpace: 'pre-wrap' }}>{`POST /api/sim\n{ "scenario": "...", "n": 8,\n  "profileType": "investors",\n  "stream": false }`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
