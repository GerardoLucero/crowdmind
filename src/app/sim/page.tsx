import { prisma } from '@/lib/db'
import { SimClient } from './SimClient'

export const dynamic = 'force-dynamic'

export default async function SimPage() {
  const recentRuns = await prisma.simRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { personas: { select: { sentiment: true } } },
  })

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto">
      <SimClient recentRuns={JSON.parse(JSON.stringify(recentRuns))} />
    </main>
  )
}
