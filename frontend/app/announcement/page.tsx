'use client'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'

export default function AnnouncementPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] font-body text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[10px] bg-zinc-900 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 tracking-tight text-lg text-zinc-900">Vaani OS</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-zinc-500 font-semibold text-sm mb-6">
            <span className="bg-zinc-200 px-3 py-1 rounded-full text-zinc-700 text-xs">Product Update</span>
            March 26, 2026
          </div>
          <h1 className="font-display font-800 text-4xl sm:text-5xl tracking-tight text-zinc-900 mb-6">
            Introducing Vaani OS 2.0: The End of Manual Data Entry.
          </h1>
          <p className="text-xl text-zinc-500 font-medium leading-relaxed">
            We rebuilt Vaani from the ground up. It is no longer just a chatbot; it is a proactive, active AI agent that manages your business operations from WhatsApp.
          </p>
        </div>

        <div className="prose prose-zinc prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-p:font-medium prose-p:text-zinc-600 prose-li:font-medium text-zinc-600">
          
          {/* Authentic Tailwind Dashboard Mockup instead of stock image */}
          <div className="rounded-[2rem] shadow-2xl border border-zinc-200 mb-16 overflow-hidden bg-zinc-50 flex aspect-[16/10] sm:aspect-[21/9] select-none pointer-events-none transform hover:scale-[1.02] transition-transform duration-500">
            {/* Sidebar Mock */}
            <div className="w-48 xl:w-56 border-r border-zinc-200 bg-[#fafafa] p-5 hidden sm:flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-display font-bold tracking-tight text-sm text-zinc-900">Vaani OS</span>
              </div>
              <div className="space-y-2 flex-1">
                {['Command Center', 'Commitments', 'Lead Sniper', 'Automations', 'Integrations'].map((item, idx) => (
                  <div key={item} className={`h-9 rounded-xl flex items-center px-3 text-xs font-semibold ${idx === 0 ? 'bg-white border border-zinc-200 shadow-sm text-zinc-900' : 'text-zinc-400'}`}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Main Canvas Mock */}
            <div className="flex-1 bg-white p-6 sm:p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="font-display font-bold text-xl text-zinc-900 tracking-tight">Command Center</div>
                  <div className="h-2 w-32 bg-zinc-100 rounded-full mt-2"></div>
                </div>
                <div className="w-8 h-8 bg-zinc-100 rounded-full"></div>
              </div>
              {/* Stats Mock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm">
                    <div className="w-6 h-6 bg-zinc-50 rounded-full mb-3"></div>
                    <div className="h-5 w-16 bg-zinc-200 rounded-md mb-2"></div>
                    <div className="h-2 w-24 bg-zinc-100 rounded-full"></div>
                  </div>
                ))}
              </div>
              {/* Charts Mock */}
              <div className="flex gap-6 flex-1 min-h-0">
                <div className="flex-[2] border border-zinc-100 bg-white rounded-2xl shadow-sm relative overflow-hidden p-5 flex flex-col">
                  <div className="font-bold text-xs text-zinc-900 mb-4">Financial Overview</div>
                  <div className="flex-1 w-full bg-gradient-to-t from-emerald-50 to-transparent flex items-end">
                     <svg className="w-full h-full opacity-50 absolute bottom-0" viewBox="0 0 100 20" preserveAspectRatio="none">
                       <path d="M0 20 L0 15 L20 10 L40 18 L60 8 L80 12 L100 5 L100 20 Z" fill="#10b981" fillOpacity="0.2"/>
                       <path d="M0 20 L0 18 L20 12 L40 19 L60 14 L80 17 L100 10 L100 20 Z" fill="#ef4444" fillOpacity="0.1"/>
                     </svg>
                  </div>
                </div>
                <div className="flex-1 border border-zinc-100 bg-white rounded-2xl shadow-sm p-5 flex flex-col">
                   <div className="font-bold text-xs text-zinc-900 mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div> Commitments
                   </div>
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-10 bg-zinc-50 border border-zinc-100 rounded-xl mb-3 mt-1"></div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <h2>Why we built Version 2.0</h2>
          <p>
            Founders, consultants, and agencies are drowning in "SaaS fatigue". You have a CRM, a task manager, a calendar, and an invoicing tool. But none of them talk to each other without complex Zapier workflows.
          </p>
          <p>
            We realized that the ultimate interface is <strong>WhatsApp</strong> and your <strong>Voice</strong>.
          </p>

          <h2>What's new in 2.0?</h2>
          <ul>
            <li><strong>Active Commitment Tracking:</strong> If you tell a client "I'll send the quote tomorrow", Vaani actively listens, logs the deadline, and natively pings you the next day to ensure it gets done. No more forgotten promises.</li>
            <li><strong>Instant Business Card Parsing:</strong> Stop typing names into your CRM. Send a photo of a business card, and Vaani's multimodal vision engine extracts the Name, Email, Phone, and Company directly into your database.</li>
            <li><strong>The Polished Command Center:</strong> We threw away the clunky dashboards and built a hyper-premium, minimalist interface that feels like Apple designed your operating system.</li>
          </ul>

          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 my-12">
            <h3 className="font-bold text-xl text-zinc-900 mb-3 mt-0">Ready to delegate your busy work?</h3>
            <p className="text-zinc-600 mb-6 text-base">You can connect your databases in exactly 3 clicks via secure OAuth. No API keys required.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-zinc-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors shadow-md">
              Try Vaani OS 2.0 Free
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
