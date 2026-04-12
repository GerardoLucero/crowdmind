# Crowdmind

AI focus groups, no scheduling required.

Crowdmind simulates how a population of N synthetic personas would react to any scenario — a CV, a product pitch, a landing page, a startup idea. You get a consensus score, sentiment breakdown, recurring patterns, outliers, and a concrete recommendation, all in under two minutes.

---

## What it does

Describe a scenario in plain text. Choose a target population. Crowdmind generates N distinct realistic personas, runs each one in parallel against your scenario, and synthesizes the results into an actionable report.

**Example scenarios:**
- "Here is my updated CV targeting Staff Engineer roles at remote companies. How would hiring managers react?"
- "I am pitching a SaaS tool for developer onboarding. Here is the one-liner. How would VCs respond?"
- "Here is the copy for my landing page. Would potential customers trust it?"

**Output includes:**
- Consensus score (0-100)
- Sentiment breakdown (positive / neutral / negative / mixed)
- Majority view (2-3 sentences)
- Minority / contrarian view
- Recurring patterns (3-5 themes)
- Surprises and outliers
- Actionable recommendation

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

## Invocable by agents

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

## How it works

Three-step pipeline, all via Anthropic's AI SDK:

1. **Generate personas** — one `claude-haiku-4.5` call generates N distinct realistic personas based on the selected profile. Each persona has a name, role, years of experience, industry, bias, and perspective.

2. **Run personas in parallel** — each persona evaluates the scenario independently via `claude-haiku-4.5`. A second structured call extracts sentiment and key points from each response. All N personas run concurrently via `Promise.allSettled`.

3. **Aggregate** — `claude-sonnet-4.6` synthesizes all responses into the final report: consensus score, sentiment breakdown, patterns, surprises, and recommendation.

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
