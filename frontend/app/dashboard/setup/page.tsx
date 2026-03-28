'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, MessageCircle, Database, Zap, ArrowRight, Copy, ExternalLink, Send } from 'lucide-react'
import { api } from '@/lib/api'

const NOTION_OAUTH_URL =
  `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_NOTION_CLIENT_ID}` +
  `&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
    process.env.NEXT_PUBLIC_BASE_URL + '/api/integrations/notion/callback'
  )}`

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_VAANI_WHATSAPP || '+91XXXXXXXXXX'

const STEPS = [
  { id: 'telegram', icon: Send,          label: 'Connect Telegram',  color: '#0088cc' },
  { id: 'notion',   icon: Database,      label: 'Connect Notion',   color: '#000000' },
  { id: 'test',     icon: Zap,           label: 'Send Action',      color: '#000000' },
]

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [telegramLinked, setTelegramLinked] = useState(false)
  const [notionLinked, setNotionLinked] = useState(false)
  const [saving, setSaving] = useState(false)

  const connectNotion = () => {
    window.location.href = NOTION_OAUTH_URL
  }

  const finish = () => {
    router.push('/dashboard?welcome=1')
  }

  const fade = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -16 },
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-lg relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 shadow-sm flex items-center justify-center mx-auto mb-5">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display font-800 tracking-tight text-3xl text-zinc-900 mb-2">
            Initialize Vaani OS
          </h1>
          <p className="text-zinc-500 font-medium text-sm">3 steps. Completes in under 2 minutes.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-sm font-display font-800 transition-all shadow-sm ${
                i < step ? 'bg-zinc-900 text-white' :
                i === step ? 'bg-white text-zinc-900 border-2 border-zinc-900 shadow-md' :
                'bg-zinc-100 text-zinc-400 border border-zinc-200'
              }`}>
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-1 rounded-full transition-all ${i < step ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">

          {/* Step 0: Telegram */}
          {step === 0 && (
            <motion.div key="tg" {...fade} className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-xl shadow-zinc-200/40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-blue-50 border border-blue-100">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight">Connect Telegram</h2>
                  <p className="text-zinc-500 font-medium text-sm mt-0.5">Primary interface for the Beta launch</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <p className="text-sm font-medium text-zinc-600 mb-4 text-center">To securely link your account, simply send your registered email to the Vaani Bot.</p>
                  <a
                    href="https://t.me/Chaitanya_VaaniBot"
                    target="_blank"
                    rel="noopener"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-display font-800 py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 text-base"
                    onClick={() => setTelegramLinked(true)}
                  >
                    <Send className="w-5 h-5" />
                    Open Telegram Assistant
                  </a>
                </div>

                <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm">
                   <p className="text-[11px] font-display font-800 text-zinc-400 uppercase tracking-widest mb-3">Your instructions</p>
                   <p className="text-zinc-700 font-medium text-sm leading-relaxed">
                     1. Tap the button above to open the bot.<br/>
                     2. Click <strong>/start</strong>.<br/>
                     3. Type your login email so I can sync your stats.
                   </p>
                </div>

                {telegramLinked ? (
                  <button
                    onClick={() => setStep(1)}
                    className="w-full bg-brand text-white font-display font-800 py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
                  >
                    Confirm & Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button disabled className="w-full bg-zinc-100 text-zinc-400 font-display font-800 py-4 rounded-2xl cursor-not-allowed">
                    Link with Bot to continue
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 1: Notion */}
          {step === 1 && (
            <motion.div key="notion" {...fade} className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-xl shadow-zinc-200/40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-zinc-100 border border-zinc-200">
                  <Database className="w-6 h-6 text-zinc-900" />
                </div>
                <div>
                  <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight">Connect Notion</h2>
                  <p className="text-zinc-500 font-medium text-sm mt-0.5">Initialize your operational Second Brain</p>
                </div>
              </div>

              <div className="space-y-4 mb-8 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
                <p className="text-zinc-900 font-bold text-sm mb-4">Vaani will construct the following databases:</p>
                {[
                  'Notes & Thought Dump Architecture',
                  'Priority Tasks & Commitments Matrix',
                  'CRM (Client Leads & Follow-ups)',
                  'Automated Ledger (Expenses & Invoices)',
                  'Agentic Meeting Transcripts',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-semibold text-zinc-600">
                    <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 border border-zinc-300">
                      <div className="w-2 h-2 rounded-full bg-zinc-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={connectNotion}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 shadow-sm text-white font-display font-800 py-4 rounded-2xl transition-all flex items-center justify-center gap-2.5 text-base"
                >
                  Authenticate Notion Workspace
                  <ExternalLink className="w-5 h-5 opacity-70" />
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-white border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-500 font-display font-800 py-3.5 rounded-2xl transition-all text-sm"
                >
                  Skip temporarily
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Test message */}
          {step === 2 && (
            <motion.div key="test" {...fade} className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-xl shadow-zinc-200/40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-[14px] bg-brand/10 border border-brand/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-brand" />
                </div>
                <div>
                  <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight">Deploy First Action</h2>
                  <p className="text-zinc-500 font-medium text-sm mt-0.5">See the agent execute in real time</p>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 mb-8 font-mono text-xs">
                {[
                  { from: 'you',   text: 'Remind me to follow up with Acme Corp tomorrow at 3 PM' },
                  { from: 'vaani', text: '⏰ Commitment logged: Acme Corp follow-up — tomorrow 3:00 PM\n🔗 Injected into your active task queue.' },
                  { from: 'you',   text: 'Draft a $4,500 invoice to Global Tech for consulting, include 5% tax.' },
                  { from: 'vaani', text: '✅ Invoice INV-2026-0001 generated: $4,725.00 (incl. tax)\n📎 PDF document compiled — tap to preview.' },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[14px] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line font-medium shadow-sm ${
                      m.from === 'you' ? 'bg-zinc-900 text-white rounded-br-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <a
                  href="https://t.me/Chaitanya_VaaniBot"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full bg-[#0088cc] hover:bg-[#0077b5] shadow-sm text-white font-display font-800 py-4 rounded-2xl transition-all text-center text-base flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send your first message on Telegram
                </a>

                <button
                  onClick={finish}
                  className="w-full bg-white border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-900 font-display font-800 py-3.5 rounded-2xl transition-all text-sm"
                >
                  Access Command Center
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step nav below card */}
        <div className="flex justify-between mt-6 px-4">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors tracking-tight">← Go Back</button>
          ) : <span />}
          <span className="text-sm font-bold text-zinc-400">Step {step + 1} of {STEPS.length}</span>
        </div>

      </div>
    </div>
  )
}
