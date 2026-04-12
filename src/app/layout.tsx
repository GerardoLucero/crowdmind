import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Persona Sim',
  description: 'AI-powered audience simulation — test ideas against N synthetic personas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
