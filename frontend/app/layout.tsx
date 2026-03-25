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
  title: 'Vaani OS — Agentic Executive Assistant',
  description: 'Voice-activated AI agent for enterprise founders and scaling organizations. Syncs natively with Notion.',
  keywords: 'AI assistant, WhatsApp AI, Enterprise automation, Agentic workflows',
  openGraph: {
    title: 'Vaani OS — Agentic Executive Assistant',
    description: 'Agentic workflow automation from voice to execution.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${nunito.variable} ${jetbrains.variable}`}>
      <body className="bg-[#fafafa] text-zinc-900 font-body antialiased selection:bg-zinc-900 selection:text-white">
        {children}
      </body>
    </html>
  )
}
