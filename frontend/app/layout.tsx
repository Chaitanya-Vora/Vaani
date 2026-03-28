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
  appleWebApp: { title: 'Vaani OS', statusBarStyle: 'black-translucent' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${nunito.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="bg-[#fafafa] text-zinc-900 font-body antialiased selection:bg-zinc-900 selection:text-white">
        {children}
        {/* Anti-Zoom Lockdown script (Native App Feel) */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
              event.preventDefault();
            }
          }, { passive: false });
          
          let lastTouchEnd = 0;
          document.addEventListener('touchend', function(event) {
            let now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
              event.preventDefault();
            }
            lastTouchEnd = now;
          }, false);

          document.addEventListener('gesturestart', function(event) {
            event.preventDefault();
          });
        `}} />
      </body>
    </html>
  )
}
