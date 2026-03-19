import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Nunito, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'], variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})
const nunito = Nunito({
  subsets: ['latin'], variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'], variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Vaani — Apna Business ka AI Dimag',
  description: 'WhatsApp pe bolo, Notion mein save ho. AI business assistant for Indian founders, MSMEs, and CA firms.',
  keywords: 'AI assistant India, WhatsApp AI, GST compliance, MSME productivity, CA software',
  openGraph: {
    title: 'Vaani — Apna Business ka AI Dimag',
    description: 'Voice se notes, tasks, invoices — sab WhatsApp pe.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${nunito.variable} ${jetbrains.variable}`}>
      <body className="bg-bg-base text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  )
}
