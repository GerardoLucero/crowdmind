import { SimClient } from './SimClient'

export default function SimPage() {
  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto" style={{ maxWidth: 1024, margin: '0 auto', padding: 24 }}>
      <SimClient />
    </main>
  )
}
