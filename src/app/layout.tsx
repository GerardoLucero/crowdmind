import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crowdmind',
  description: 'AI focus groups in under a minute: test a CV, pitch or copy against a panel of simulated people.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
