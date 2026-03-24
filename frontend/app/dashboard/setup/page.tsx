'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, MessageCircle, Database, Zap, ArrowRight, Copy, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'

const NOTION_OAUTH_URL =
  `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_NOTION_CLIENT_ID}` +
  `&response_type=code&owner=user&redirect_uri=${encodeURIComponent(
    process.env.NEXT_PUBLIC_BASE_URL + '/api/integrations/notion/callback'
  )}`

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_VAANI_WHATSAPP || '+91XXXXXXXXXX'

const STEPS = [
  { id: 'whatsapp', icon: MessageCircle, label: 'Connect WhatsApp', color: '#25D366' },
  { id: 'notion',   icon: Database,      label: 'Connect Notion',   color: '#FF6B00' },
  { id: 'test',     icon: Zap,           label: 'Send first message', color: '#7F77DD' },
]

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [waNumber, setWaNumber] = useState('')
  const [waLinked, setWaLinked] = useState(false)
  const [notionLinked, setNotionLinked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyNumber = () => {
    navigator.clipboard.writeText(WHATSAPP_NUMBER)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveWhatsApp = async () => {
    if (!waNumber.match(/^\+?\d{10,13}$/)) return
    setSaving(true)
    try {
      await api.dashboard.updateProfile({ whatsapp_number: waNumber })
      setWaLinked(true)
    } finally {
      setSaving(false)
    }
  }

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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-800 text-2xl text-text-primary mb-2">
            Set up your Vaani OS
          </h1>
          <p className="text-text-secondary text-sm">3 steps. Takes under 2 minutes.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-700 transition-all ${
                i < step ? 'bg-brand text-white' :
                i === step ? 'bg-brand/20 text-brand border border-brand/40' :
                'bg-bg-surface text-text-muted border border-bg-border'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-10 h-0.5 transition-all ${i < step ? 'bg-brand' : 'bg-bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">

          {/* Step 0: WhatsApp */}
          {step === 0 && (
            <motion.div key="wa" {...fade} className="bg-bg-surface border border-bg-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#25D36620' }}>
                  <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} />
                </div>
                <div>
                  <h2 className="font-display font-700 text-text-primary">Connect WhatsApp</h2>
                  <p className="text-text-secondary text-xs">Save your number so Vaani can reach you</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-display font-600 text-text-secondary uppercase tracking-wider mb-2 block">
                    Your WhatsApp number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={waNumber}
                    onChange={e => setWaNumber(e.target.value)}
                    className="w-full bg-bg-base border border-bg-border rounded-xl px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-brand/50 transition-colors"
                  />
                  <p className="text-text-muted text-xs mt-1.5">Include country code. E.g. +91 for India.</p>
                </div>

                <div className="bg-bg-base border border-bg-border rounded-xl p-4">
                  <p className="text-xs text-text-secondary mb-2 font-display font-600">Then save Vaani's number on your phone:</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-brand font-600">{WHATSAPP_NUMBER}</span>
                    <button
                      onClick={copyNumber}
                      className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand hover:text-brand-light flex items-center gap-1 ml-auto transition-colors"
                    >
                      Open in WhatsApp <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={saveWhatsApp}
                  disabled={!waNumber || saving}
                  className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-white font-display font-700 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                  {!saving && <ArrowRight className="w-4 h-4" />}
                </button>

                {waLinked && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-success text-sm font-600">
                    <CheckCircle className="w-4 h-4" /> WhatsApp saved! Click continue.
                    <button onClick={() => setStep(1)} className="ml-auto text-brand font-700 text-xs hover:underline">
                      Next →
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 1: Notion */}
          {step === 1 && (
            <motion.div key="notion" {...fade} className="bg-bg-surface border border-bg-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand/10">
                  <Database className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h2 className="font-display font-700 text-text-primary">Connect Notion</h2>
                  <p className="text-text-secondary text-xs">Vaani will create your Second Brain workspace</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  'Notes & Idea Dumps database',
                  'Tasks & Commitments tracker',
                  'CRM (clients + follow-ups)',
                  'Expense log + Invoice history',
                  'Meeting minutes',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <div className="w-4 h-4 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={connectNotion}
                className="w-full bg-brand hover:bg-brand-light text-white font-display font-700 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
              >
                Connect Notion workspace
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full border border-bg-border hover:border-brand/30 text-text-muted hover:text-text-secondary font-display font-600 py-2.5 rounded-xl transition-all text-sm"
              >
                Skip for now (I'll connect later)
              </button>
            </motion.div>
          )}

          {/* Step 2: Test message */}
          {step === 2 && (
            <motion.div key="test" {...fade} className="bg-bg-surface border border-bg-border rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h2 className="font-display font-700 text-text-primary">Send your first message</h2>
                  <p className="text-text-secondary text-xs">See Vaani work in real time</p>
                </div>
              </div>

              <div className="bg-[#0e1621] rounded-xl p-4 space-y-3 mb-6 font-mono text-xs">
                {[
                  { from: 'you',   text: 'Kal 3 baje Mehta ji ko follow-up karna hai' },
                  { from: 'vaani', text: '⏰ Reminder set: Mehta ji follow-up — tomorrow 3:00 PM\n🔗 Added to your Commitments tracker' },
                  { from: 'you',   text: 'Sharma & Sons ko ₹45,000 ka invoice bhejo, GST 18%' },
                  { from: 'vaani', text: '✅ Invoice INV-2026-0001 created: ₹53,100 (incl. 18% GST)\n📎 PDF ready — tap to download' },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                      m.from === 'you' ? 'bg-[#005c4b] text-white' : 'bg-[#202c33] text-[#e9edef]'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=Kal%203%20baje%20Mehta%20ji%20ko%20follow-up%20karna%20hai`}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-[#25D366] hover:bg-[#1fb254] text-white font-display font-700 py-3.5 rounded-xl transition-all text-center text-sm mb-3"
              >
                Send this message on WhatsApp →
              </a>

              <button
                onClick={finish}
                className="w-full border border-bg-border hover:border-brand/30 text-text-secondary hover:text-text-primary font-display font-600 py-2.5 rounded-xl transition-all text-sm"
              >
                Go to Command Center
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step nav below card */}
        <div className="flex justify-between mt-4 px-1">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← Back</button>
          ) : <span />}
          <span className="text-xs text-text-muted">{step + 1} of {STEPS.length}</span>
        </div>

      </div>
    </div>
  )
}
