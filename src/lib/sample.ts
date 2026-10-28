import { sentimentStats, type PersonaResult } from './sim-engine'
import type { Run } from './types'

const SCENARIO =
  'We are building a mobile app that compares supermarket prices for Mexican households. Users scan their grocery receipt, and the app tells them which nearby store would have been cheaper and by how much. Free for users; we earn from store promotions. Seed round of 400k USD to reach 50k active households in 12 months.'

const p = (
  index: number,
  name: string,
  role: string,
  yearsExperience: number,
  industry: string,
  bias: string,
  response: string,
  sentiment: PersonaResult['sentiment'],
  keyPoints: string[]
): PersonaResult => ({
  index,
  profile: { name, role, yearsExperience, industry, bias, perspective: 'Judges consumer apps by retention and unit economics.' },
  response,
  sentiment,
  keyPoints,
  tokens: 0,
  durationMs: 0,
})

const results: PersonaResult[] = [
  p(0, 'Valeria Ortega', 'Partner at a LatAm consumer-tech seed fund', 9, 'Consumer apps', 'Retention over acquisition',
    'Receipt scanning is a real habit hook, because the user gets a concrete peso figure every week. My worry is the second month: people stop scanning unless the savings are visible and recurring. If you can show 40 percent week-8 retention in a pilot city, I would take the meeting.',
    'positive', ['Weekly savings number is a strong hook', 'Retention after month two decides everything']),
  p(1, 'Daniel Brooks', 'Angel investor, ex-marketplace operator', 12, 'Marketplaces', 'Distribution and defensibility',
    'Price comparison is easy to copy and hard to monetize. Store promotions only pay when you control a lot of traffic, and 50k households is small for retailers to care. I would need proof that a chain will pay for placement before I write a check.',
    'negative', ['Monetization depends on traffic you do not have yet', 'Easy to copy without a data moat']),
  p(2, 'Mariana Solís', 'Principal at a fintech and retail VC', 7, 'Retail tech', 'Unit economics',
    'Receipt data is the interesting asset, more than the app. Purchase baskets by neighborhood are valuable to brands and retailers. The pitch undersells that, and it also hides how you will clean receipts at scale without a large OCR bill.',
    'mixed', ['Receipt data may be worth more than the app', 'OCR cost and accuracy are unaddressed']),
  p(3, 'Tomás Reyes', 'Founder and angel, grocery delivery exit', 11, 'Grocery and logistics', 'Operator view of retail margins',
    'Supermarket margins are thin and chains already guard their prices, so expect friction. Still, households are very price-sensitive right now and nobody owns this niche in Mexico. I like the market, I am less sure about the team having retail relationships.',
    'mixed', ['Households are price-sensitive and underserved', 'Retail relationships are the missing piece']),
  p(4, 'Priya Nair', 'Investor at a global growth fund', 14, 'Consumer internet', 'Market size and scale',
    'Seed rounds this size want a clear path to a large outcome. A free app funded by promotions caps out quickly unless it expands to other categories. The 12-month target is plausible, the 5-year story is missing.',
    'negative', ['Outcome size looks capped', 'Missing a 5-year expansion story']),
  p(5, 'Luis Fernández', 'Angel investor, Mexico-based', 8, 'SMB and consumer', 'Local market fit',
    'This solves a daily pain that I feel myself. Households already compare prices by hand across apps and flyers. A clean receipt-based flow is a good wedge, and Mexico has enough smartphone penetration for the pilot you describe.',
    'positive', ['Real daily pain with a clear wedge', 'Smartphone penetration supports the pilot']),
]

const stats = sentimentStats(results)

export const SAMPLE_RUN: Run = {
  id: 'sample',
  scenario: SCENARIO,
  n: results.length,
  profileType: 'investors',
  callerType: 'user',
  callerId: '',
  results,
  successCount: results.length,
  totalTokens: 0,
  durationMs: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  sample: true,
  aggregation: {
    consensusScore: stats.consensusScore,
    sentimentBreakdown: stats.sentimentBreakdown,
    consensus:
      'The group likes the problem and the receipt-scanning hook, but splits on whether the business can monetize and defend itself. Supporters point to a real daily pain; skeptics point to thin retail margins and an easy-to-copy comparison feature.',
    dissent: 'Two investors would pass today: one sees a capped outcome, the other wants a paying retailer before investing.',
    topPatterns: [
      'Retention after the first month is the make-or-break metric',
      'Monetization through store promotions needs traffic the app does not have yet',
      'The receipt data could be the real asset',
    ],
    surprises: ['Several investors value the purchase data more than the app itself', 'Nobody questioned the market need, only the business model'],
    recommendation:
      'Run a pilot in one city and report week-8 retention and savings per household. In parallel, sign one retailer for a paid placement test so the monetization claim has evidence. Reframe the pitch around the receipt data asset.',
  },
}

export const EXAMPLE_SCENARIOS: { label: string; profileType: string; text: string }[] = [
  { label: 'Startup pitch', profileType: 'investors', text: SCENARIO },
  {
    label: 'Developer CV',
    profileType: 'hiring-managers',
    text: 'Senior backend engineer, 9 years of experience in payments and distributed systems (Java, Kotlin, Kafka, AWS). Led a team of 6 and cut payment failures by 35 percent. Looking for remote roles at international companies. How would hiring managers react to this profile?',
  },
  {
    label: 'Landing page copy',
    profileType: 'customers',
    text: 'Headline: "Close your books in 2 days, not 10." Subhead: "Automated reconciliation for small accounting firms. Connect your bank, review exceptions, done." Pricing starts at 49 USD per month per client. Would you sign up for a trial?',
  },
]
