'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mic, BrainCircuit, Target, Share2, Users, Receipt,
  Sparkles, ArrowRight, CheckCircle, Menu, X, Star, Globe, Database
} from 'lucide-react'

const FEATURES = [
  {
    icon: BrainCircuit, title: 'Hinglish Intent Engine',
    desc: 'Powered by Gemini 2.0. "Gupta ji ko 50k bill bhejo" converts instantly to a Notion action without missed context.',
    badge: 'Core',
  },
  {
    icon: Target, title: 'Commitment Tracker',
    desc: 'Vaani extracts "I’ll do it by Friday" from voice notes, logs it in Notion, and pings you via WhatsApp at the exact deadline.',
    badge: 'Active Agent',
  },
  {
    icon: Share2, title: 'Lead Sniper CRM',
    desc: 'Drop a VCF or text. Vaani updates your CRM and fires off a Slack/Teams webhook so your team can jump on it fast.',
    badge: null,
  },
  {
    icon: Database, title: 'Second Brain Architect',
    desc: '"Dump an idea for a SaaS" creates a structured Notion page with Executive Summary, Challenges, and Next Steps instantly.',
    badge: 'Pro',
  },
  {
    icon: Receipt, title: 'GST Invoice Engine',
    desc: 'Generate perfectly compliant PDF invoices locally via voice commands and ship them directly via WhatsApp.',
    badge: 'India-First',
  },
  {
    icon: Sparkles, title: 'Daily Habit Tracker',
    desc: 'Log habits via voice. Vaani updates the Notion DB & returns a beautifully rendered Framer Motion gauge chart.',
    badge: null,
  },
]

const TESTIMONIALS = [
  {
    name: 'Rajesh Mehta', role: 'Founder, TechStart Pune',
    text: 'It’s no longer just a message router. Vaani physically holds me accountable to the promises I make to clients. It’s an active brain.',
    rating: 5,
  },
  {
    name: 'Priya Sharma', role: 'Agency Owner, Mumbai',
    text: 'I just forward VCF cards into Vaani. 10 seconds later, my team gets a fully logged lead in our Slack channel with CRM links.',
    rating: 5,
  },
  {
    name: 'Ankit Agarwal', role: 'D2C Builder, Surat',
    text: 'The Second Brain idea dumping is insane. The structure it natively builds in Notion saves me 2 hours of typing every week.',
    rating: 5,
  },
]

const PLANS = [
  {
    name: 'Starter', price: '₹299', per: '/maah', tasks: '50 tasks',
    target: 'Solo founders & freelancers',
    cta: 'Free trial shuru karo',
    features: ['Hinglish Voice Engine', 'Voice → Notion basic notes', '50 tasks/month', 'Google Calendar sync'],
    popular: false,
  },
  {
    name: 'Growth', price: '₹799', per: '/maah', tasks: '200 tasks',
    target: 'Operators & builders',
    cta: 'Free trial shuru karo',
    features: ['Sab Starter mein +', 'Commitment Tracking Engine', 'Lead Sniper Webhooks', 'Structured Templates', 'Tally export'],
    popular: true,
  },
  {
    name: 'Pro / Enterprise', price: '₹2,499', per: '/maah', tasks: 'Unlimited',
    target: 'Agencies & scaling teams',
    cta: 'Sales se baat karo',
    features: ['Sab Growth mein +', 'Custom Automation routing', 'High-volume Flash-Lite quota', '10 team members', 'Priority WhatsApp support'],
    popular: false,
  },
]

const INTEGRATIONS = ['Notion', 'Google Calendar', 'Slack', 'WhatsApp', 'Telegram', 'MS Teams', 'Razorpay', 'LinkedIn']

const WA_DEMOS = [
  { from: 'user', text: '🎙️ [Voice 0:14] — "Kal subah 10 baje Sharma ji ka quote bhejna hai, pakka."' },
  { from: 'vaani', text: '🎯 Commitment logged for tomorrow 10:00 AM. I’ll BCC track this!\n\n📋 Sharma ji quote due.\n🔗 [Open Commitment in Notion]' },
  { from: 'user', text: 'Drop an idea for a SaaS: A tool that writes unit tests from code diffs.' },
  { from: 'vaani', text: '✅ Idea Blueprint saved: *DiffWriter SaaS*\n\nIncludes Executive Summary, Challenges, and Action Items.\n🔗 notion.so/saas-idea' },
]

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [demoIdx, setDemoIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDemoIdx(i => Math.min(i + 1, WA_DEMOS.length - 1)), 2500)
    return () => clearInterval(t)
  }, [])

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-body overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-bg-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-lg">Vaani</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary font-display">
            <a href="#features" className="hover:text-text-primary transition-colors">OS Features</a>
            <a href="#pricing"  className="hover:text-text-primary transition-colors">Pricing</a>
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login"  className="text-sm font-display font-500 text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Log in</Link>
            <Link href="/auth/signup" className="text-sm font-display font-600 bg-brand hover:bg-brand-light text-white px-5 py-2 rounded-xl transition-all hover:shadow-glow-sm">
              Free trial
            </Link>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden text-text-secondary">
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-teal/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-brand rounded-full animate-pulse-slow" />
                <span className="text-brand-light text-xs font-display font-600">Enterprise-OS • The Agentic Evolution</span>
              </div>

              <h1 className="font-display font-800 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
                Not a Router.
                <br /><span className="glow-text">An Active Agent</span>
                <br />For Indian Founders.
              </h1>
              <p className="text-text-secondary text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                Powered by Gemini 2.0 Flash-Lite to orchestrate your Notion Second Brain, track active commitments, and sniper leads — all through WhatsApp.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-display font-600 px-7 py-3.5 rounded-xl transition-all hover:shadow-brand active:scale-95 text-base">
                  Unlock the AgentOS
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center gap-2 border border-bg-border hover:border-brand/40 text-text-secondary hover:text-text-primary font-display font-500 px-7 py-3.5 rounded-xl transition-all text-base">
                  View Command Center
                </Link>
              </div>
            </motion.div>

            {/* WhatsApp mockup */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} id="demo" className="relative">
              <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden shadow-card max-w-sm mx-auto">
                <div className="bg-[#00a884] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-600">Vaani Agent</p>
                    <p className="text-white/70 text-xs">online</p>
                  </div>
                </div>
                <div className="px-3 py-4 space-y-3 min-h-[320px] bg-[#0e1621]">
                  {WA_DEMOS.slice(0, demoIdx + 1).map((m, i) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                        m.from === 'user' ? 'bg-[#005c4b] text-white rounded-br-sm' : 'bg-[#202c33] text-[#e9edef] rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Integrations marquee ── */}
      <section className="py-10 border-y border-bg-border overflow-hidden">
        <p className="text-center text-text-muted text-xs font-display font-600 uppercase tracking-widest mb-6">Agentic Toolchain</p>
        <div className="flex animate-marquee gap-12 w-max">
          {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
            <span key={i} className="text-text-muted text-sm font-display font-500 whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity">{name}</span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand text-xs font-display font-600 uppercase tracking-widest mb-3">Destruction-Level Workflows</p>
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">You just breathe. Vaani executes.</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">We ripped out the generic routing layer and embedded a deeply integrated, highly opinionated system.</p>
          </div>
          <motion.div variants={containerFramer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, badge }) => (
              <motion.div variants={itemFramer} key={title} className="bg-bg-surface border border-bg-border rounded-2xl p-6 hover:border-brand/30 transition-all duration-300 group shadow-[inset_0_1px_0_#ffffff05]">
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand/20 transition-all">
                  <Icon className="w-6 h-6 text-brand" />
                </div>
                {badge && (
                  <span className={`text-[10px] font-display font-700 px-2 py-0.5 rounded-full mb-3 inline-block uppercase tracking-wider ${badge.includes('India') ? 'bg-[#FF9933]/15 text-[#FF9933]' : 'bg-brand/10 text-brand-light'}`}>{badge}</span>
                )}
                <h3 className="font-display font-700 text-text-primary mb-2 text-lg">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── India moat ── */}
      <section className="py-24 px-4 sm:px-6 bg-bg-surface/50">
        <div className="max-w-4xl mx-auto bg-bg-base border border-bg-border rounded-[2rem] p-8 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative">
            <h2 className="font-display font-800 text-3xl sm:text-5xl mb-6">
              The "Founder's Religion" Mindset.
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-2xl leading-relaxed">
              Most AI apps are generic wrappers. Vaani is built as an enterprise-grade agent. It leverages Gemini 2.0 Flash-Lite caching limits to hold your entire company's context in active memory—making queries and CRM injections instantaneous.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
              {[
                'Multimodal raw audio byte streaming (No Whisper middleware lag)',
                'Rigorous Date parsing for Hinglish ("Parso do dopahar mein")',
                'Notion Dynamic Templates Generation (Idea Dumps)',
                'Framer Motion Habit loop render directly to WA',
                'Active Celery Observers that trigger when you promise a deadline',
                'Client Reliability Scoring integrated automatically'
              ].map((label, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <span className="text-sm text-text-primary font-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">Scalable Agentic Quotas.</h2>
            <p className="text-text-secondary">Flash-Lite cuts inference costs down 8x. We passed the savings to you.</p>
          </div>
          <motion.div variants={containerFramer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, per, tasks, target, cta, features, popular }) => (
              <motion.div variants={itemFramer} key={name} className={`relative rounded-3xl p-8 border ${popular ? 'bg-bg-elevated border-brand shadow-[0_0_40px_rgba(255,107,0,0.1)]' : 'bg-bg-surface border-bg-border'}`}>
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-display font-800 px-4 py-1 rounded-full uppercase tracking-wider">The Standard</div>
                )}
                <p className="text-text-muted text-xs font-display font-600 uppercase tracking-widest mb-1">{target}</p>
                <h3 className="font-display font-800 text-2xl text-text-primary mb-2">{name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-800 text-brand">{price}</span>
                  <span className="text-text-muted text-sm">{per}</span>
                </div>
                <Link href="/auth/signup"
                  className={`block text-center text-sm font-display font-700 py-3.5 rounded-xl transition-all mb-8 ${popular ? 'bg-brand hover:bg-brand-light text-white shadow-brand hover:scale-105' : 'border-2 border-bg-border hover:border-brand/40 text-text-primary hover:bg-bg-base'}`}>
                  {cta}
                </Link>
                <ul className="space-y-3">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <Sparkles className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-bg-border py-12 px-4 sm:px-6 bg-bg-surface">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center"><BrainCircuit className="w-3.5 h-3.5 text-white" /></div>
              <span className="font-display font-800">Vaani OS</span>
            </div>
            <p className="text-text-muted text-sm font-500 max-w-xs">The Active Agentic System built for heavy-duty operators.</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-bg-border flex justify-between items-center text-text-muted text-xs font-600">
          <span>© 2026 Vaani Enterprise.</span>
        </div>
      </footer>
    </div>
  )
}
