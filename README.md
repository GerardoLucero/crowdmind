# Crowdmind

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Anthropic AI](https://img.shields.io/badge/Anthropic-Claude-orange)](https://www.anthropic.com)

**AI focus groups, instant feedback. No scheduling, no bias.**

> **Problem:** Getting feedback on your CV, pitch, or product takes weeks (email → waiting for responses → aggregating → biased sample).  
> **Solution:** Submit your scenario to Crowdmind. Get synthesis from N personas in **2 minutes**.

---

## 🎯 The Value Proposition

| Metric | Impact |
|--------|--------|
| **Feedback Time** | Weeks → 2 minutes |
| **Personas** | 3-30 diverse perspectives (parallel evaluation) |
| **Cost per run** | ~$0.015-0.045 (Haiku + Sonnet synthesis) |
| **Use cases** | CVs, pitches, product copy, startup ideas, landing pages |
| **Output** | Consensus score, sentiment, patterns, outliers, recommendation |

---

## ⚡ Key Features

✅ **Instant Focus Groups** — No recruiting, scheduling, or respondent bias  
✅ **Diverse Perspectives** — Hiring managers, CTOs, investors, customers, tech leads, peers  
✅ **Parallel Execution** — All personas evaluate simultaneously  
✅ **AI-Powered Synthesis** — Haiku for speed, Sonnet for quality aggregation  
✅ **API-First Design** — Any agent can invoke Crowdmind autonomously  
✅ **Custom Populations** — Define your own persona profiles  
✅ **Actionable Output** — Score, patterns, surprises, recommendation  
✅ **Audit Trail** — Track which agent made which decision

---

## 📊 How It Works

```
┌─────────────────────────────┐
│  Input: Your Scenario       │
│  "Here's my CV for         │
│   Staff Engineer roles"     │
└────────────┬────────────────┘
             │
    ┌────────▼──────────┐
    │  Select Population │
    │  (hiring-managers) │
    └────────┬──────────┘
             │
    ┌────────▼──────────────────┐
    │  Generate N Personas      │
    │  (name, role, bias,       │
    │   perspective, exp)       │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │  Run Personas in Parallel │
    │  - Each evaluates scenario │
    │  - Haiku model (fast)      │
    │  - Concurrent execution    │
    └────────┬──────────────────┘
             │
    ┌────────▼──────────────────┐
    │  Aggregate Results         │
    │  - Sonnet synthesizes      │
    │  - Score, sentiment, themes│
    └────────┬──────────────────┘
             │
    ┌────────▼─────────────────────┐
    │  Output: Actionable Report    │
    │  • Consensus 0-100            │
    │  • Sentiment breakdown         │
    │  • Patterns & outliers         │
    │  • Recommendation              │
    └───────────────────────────────┘
```

**Example scenarios:**
- "Here is my updated CV targeting Staff Engineer roles at remote companies. How would hiring managers react?"
- "I am pitching a SaaS tool for developer onboarding. Here is the one-liner. How would VCs respond?"
- "Here is the copy for my landing page. Would potential customers trust it?"

---

## Available population presets

| Preset | Description |
|---|---|
| `hiring-managers` | Recruiters and technical managers evaluating candidates |
| `tech-leads` | Staff and Senior Engineers assessing technical credibility |
| `ctors` | CTOs and VP Engs evaluating business and technical strategy |
| `recruiters` | Technical recruiters focused on market fit and positioning |
| `peers` | Senior engineers and architects evaluating real-world credibility |
| `investors` | Angels and VCs evaluating market size, team, and defensibility |
| `customers` | Potential buyers evaluating ROI, ease of use, and trust |

You can define custom population profiles via the API.

---

## 💡 Why This Project Exists

When you're building products or pitching for jobs, **getting real feedback is hard**:
- Asking friends biases the response (they'll be polite)
- Professional feedback is expensive and slow
- A/B testing requires real users

**Crowdmind solves this:** Get honest, diverse perspective from N synthetic personas in 2 minutes for ~$0.02.

**Real use cases:**
- CV review before applying to international roles (hiring-managers perspective)
- Pitch validation before investor meetings (investors perspective)
- Product copy testing before launch (customers perspective)
- Startup idea evaluation (multi-perspective synthesis)

**Technical innovation:**
- Uses cheapest models (Haiku) for parallel evaluation
- Reserves expensive model (Sonnet) for quality synthesis
- Runs all personas concurrently via `Promise.allSettled`
- Audit trail tracks which AI agent made which decision (agent autonomy)

---

## 🤖 Invocable by agents

Crowdmind exposes a REST API that any AI agent can call autonomously. This means your agents can validate ideas, test messaging, or evaluate decisions without human intervention.

```
POST /api/sim
{
  "scenario": "...",
  "n": 10,
  "profileType": "hiring-managers",
  "callerType": "agent",
  "callerId": "career-strategist"
}
```

The `callerType: "agent"` field tracks which agent initiated the simulation, so you can audit autonomous decisions.

---

## 🔧 Technical Architecture

**Three-step pipeline, all via Anthropic AI SDK:**

1. **Generate Personas** (1 call, ~2K tokens)
   - Input: Population profile (e.g., "hiring-managers")
   - Output: N personas with name, role, years exp, industry, bias, perspective
   - Model: `claude-haiku-4.5` (cheapest, sufficient for generation)

2. **Run Personas in Parallel** (N calls, ~15K tokens per run)
   - Each persona evaluates scenario independently
   - Structured output extraction (sentiment, key points)
   - Concurrent via `Promise.allSettled` (no blocking)
   - Model: `claude-haiku-4.5` (fast, cheap for bulk evaluation)

3. **Aggregate Results** (1 call, ~10K tokens)
   - Input: All N persona responses
   - Output: Consensus score, sentiment breakdown, patterns, surprises, recommendation
   - Model: `claude-sonnet-4.6` (quality synthesis, higher token cost justified)

**Cost optimization:** 90% of tokens via Haiku (~$0.002/1K), 10% via Sonnet (~$0.003/1K)

---

## Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** Anthropic AI SDK (`@ai-sdk/anthropic`) — Haiku for personas, Sonnet for synthesis
- **Database:** Prisma with SQLite (local) or PostgreSQL (production)
- **Language:** TypeScript

---

## Getting started

### Prerequisites

- Node.js 20+
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

### Installation

```bash
git clone https://github.com/your-username/crowdmind.git
cd crowdmind
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL="file:./dev.db"
```

### Database setup

```bash
npm run db:generate
npm run db:push
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The simulation lab is at `/sim`.

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel deploy
```

Set `ANTHROPIC_API_KEY` and `DATABASE_URL` in your Vercel project environment variables.

For production, replace SQLite with a PostgreSQL provider (Supabase, Neon, Railway, or Vercel Postgres). Update the `datasource` in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Self-hosted

Any Node.js host (Railway, Render, Fly.io) works. The app requires:
- `ANTHROPIC_API_KEY`
- `DATABASE_URL` pointing to a supported Prisma database

---

## Cost

Crowdmind uses Anthropic's cheapest models for the heavy lifting. Rough estimates at published rates:

| Simulation | Tokens (approx.) | Estimated cost |
|---|---|---|
| 10 personas | ~15,000 tokens | ~$0.015 |
| 20 personas | ~30,000 tokens | ~$0.030 |
| 30 personas | ~45,000 tokens | ~$0.045 |

Synthesis uses `claude-sonnet-4.6` for quality. The remaining calls use `claude-haiku-4.5`.

---

## API reference

### POST /api/sim

Run a simulation.

**Request body:**

| Field | Type | Default | Description |
|---|---|---|---|
| `scenario` | string | required | The scenario to evaluate |
| `n` | number | 10 | Number of personas (3-30) |
| `profileType` | string | `hiring-managers` | Population preset |
| `profileConfig` | object | — | Custom profile (overrides preset) |
| `callerType` | `user` or `agent` | `user` | Who is invoking |
| `callerId` | string | — | Agent identifier (if `callerType: "agent"`) |

**Response:** Simulation ID, aggregation result, token count, duration.

### GET /api/sim?id={simId}

Retrieve a completed simulation with all individual persona responses.

### GET /api/sim

List the 20 most recent simulations.

---

## Custom population profiles

Pass a `profileConfig` object to define your own population:

```json
{
  "scenario": "My product description...",
  "n": 15,
  "profileType": "custom",
  "profileConfig": {
    "role": "Head of Engineering at a healthcare company",
    "experience": "8-15 years in software, last 3 in healthcare tech",
    "industry": "Healthcare SaaS",
    "bias": "Compliance-first mindset, skeptical of new vendors"
  }
}
```

---

## Project structure

```
crowdmind/
├── prisma/
│   └── schema.prisma          Database schema (SimRun, SimPersona)
├── src/
│   ├── app/
│   │   ├── sim/
│   │   │   ├── page.tsx       Server component — loads recent runs
│   │   │   └── SimClient.tsx  Client component — UI and state
│   │   └── api/
│   │       └── sim/
│   │           └── route.ts   POST and GET handlers
│   └── lib/
│       ├── db.ts              Prisma client singleton
│       └── sim-engine.ts      Core simulation logic (generatePersonas, runPersona, aggregateResults)
├── .env.example
└── README.md
```

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss the direction.

Areas where contributions add clear value:
- Additional population presets
- Export to CSV / PDF
- Streaming results as personas complete
- Comparison view between two scenarios

---

## License

MIT
