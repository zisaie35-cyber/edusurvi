import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EduSuivi — Suivi scolaire',
  description: 'Plateforme de suivi scolaire',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
