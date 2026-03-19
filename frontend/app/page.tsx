'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Mic, FileText, CheckSquare, Users, Calendar, Receipt,
  Zap, Bell, Globe, ArrowRight, ChevronRight, MessageCircle,
  Star, Shield, TrendingUp, Clock, CheckCircle, Menu, X,
  Smartphone, Building2, IndianRupee, Briefcase, BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Mic, title: 'Voice → Notion Note',
    desc: 'Hindi ya English mein bolo — Vaani transcribe karke structured note Notion mein save kar deta hai.',
    badge: 'Most used',
  },
  {
    icon: CheckSquare, title: 'Task & Reminder',
    desc: '"Sharma ji ko Friday tak proposal bhejna hai" — task add, reminder set, Google Calendar update. Ek message mein.',
    badge: null,
  },
  {
    icon: Bell, title: 'GST/TDS Deadline Alerts',
    desc: 'GSTR-3B, Advance Tax, TDS return — sabke WhatsApp reminders 3 din pehle, 1 din pehle, aur din par.',
    badge: '🇮🇳 India only',
  },
  {
    icon: Users, title: 'Client CRM',
    desc: 'Call ke baad voice dump karo — client record update, follow-up date set, Zoho sync.',
    badge: null,
  },
  {
    icon: Receipt, title: 'GST Invoice Generator',
    desc: '"ABC Corp ko ₹45,000 ka invoice chahiye, 18% GST" — GSTIN-compliant PDF ready, WhatsApp pe bhej do.',
    badge: '🇮🇳 India only',
  },
  {
    icon: FileText, title: 'Meeting Minutes',
    desc: 'Meeting ke baad 2 minute ka voice note — structured minutes, action items, follow-ups sab Notion mein.',
    badge: null,
  },
  {
    icon: Zap, title: 'Automations',
    desc: 'Weekly report, monthly expense summary, festival client greetings — ek baar set karo, Vaani chalta rahega.',
    badge: 'Growth+',
  },
  {
    icon: Globe, title: 'Deep Research',
    desc: 'Sector reports, competitor analysis, SEBI circulars — voice se research request, full report Notion mein.',
    badge: 'Pro',
  },
]

const TESTIMONIALS = [
  {
    name: 'Rajesh Mehta', role: 'Founder, TechStart Pune',
    text: 'GSTR-3B bhoolna meri badi problem thi. Ab Vaani teen din pehle reminder deta hai. CA bhi khush hai.',
    rating: 5,
  },
  {
    name: 'Priya Sharma', role: 'CA, Mumbai',
    text: '40 clients ke compliance track karna ek WhatsApp se ho gaya. Meri team ka 8 ghante/week bachta hai.',
    rating: 5,
  },
  {
    name: 'Ankit Agarwal', role: 'D2C Brand Owner, Surat',
    text: 'Vendor calls ke baad voice note bhejta hoon — CRM update, follow-up set, invoice draft. Magic hai.',
    rating: 5,
  },
]

const PLANS = [
  {
    name: 'Starter', price: '₹299', per: '/maah', tasks: '50 tasks',
    target: 'Solo founders & freelancers',
    cta: 'Free trial shuru karo',
    features: ['WhatsApp + Telegram bot', 'Voice → Notion notes', 'GST deadline alerts', '50 tasks/month', 'Google Calendar sync'],
    popular: false,
  },
  {
    name: 'Growth', price: '₹799', per: '/maah', tasks: '200 tasks',
    target: 'MSME owners & teams',
    cta: 'Free trial shuru karo',
    features: ['Sab Starter mein +', 'GST invoice generator', 'Client CRM automation', 'Automations + webhooks', '3 team members', 'Tally export'],
    popular: true,
  },
  {
    name: 'Pro / CA & AIF', price: '₹2,499', per: '/maah', tasks: 'Unlimited',
    target: 'CA firms & SEBI entities',
    cta: 'Sales se baat karo',
    features: ['Sab Growth mein +', 'Multi-client compliance board', 'SEBI AIF/PMS reminders', 'Investor update drafts', '10 team members', 'Priority WhatsApp support'],
    popular: false,
  },
]

const INTEGRATIONS = ['Notion', 'Google Calendar', 'Gmail', 'WhatsApp', 'Telegram', 'Zoho CRM', 'Tally', 'Razorpay', 'LinkedIn', 'Instagram']

const WA_DEMOS = [
  { from: 'user', text: '🎙️ [Voice 2:14] — Aaj Kapoor & Sons ke saath meeting hui, unhone ₹1.2L ka order confirm kiya, advance 30% mangte hain, proposal Friday tak chahiye.' },
  { from: 'vaani', text: '✅ Meeting note saved!\n\n📋 Kapoor & Sons — Order Confirmed\n• Order value: ₹1,20,000\n• Advance: 30% = ₹36,000\n• Proposal due: Friday\n\n2 tasks added, follow-up set.\n🔗 notion.so/kapoor-meeting' },
  { from: 'user', text: 'GSTR-3B kab due hai is mahine?' },
  { from: 'vaani', text: '📅 GSTR-3B October 2024\nDue date: 20 November 2024\n\n⚠️ Late fee: ₹50/day (max ₹10,000)\n+ 18% interest on tax due\n\nYaad dilana chahoge? Reply REMIND.' },
]

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [demoIdx, setDemoIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDemoIdx(i => Math.min(i + 1, WA_DEMOS.length - 1)), 1800)
    return () => clearInterval(t)
  }, [])

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
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-text-primary transition-colors">Pricing</a>
            <a href="#for-who"  className="hover:text-text-primary transition-colors">For whom</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login"  className="text-sm font-display font-500 text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Login</Link>
            <Link href="/auth/signup" className="text-sm font-display font-600 bg-brand hover:bg-brand-light text-white px-5 py-2 rounded-xl transition-all hover:shadow-glow-sm">
              Free trial
            </Link>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden text-text-secondary">
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-bg-border bg-bg-surface px-4 py-4 space-y-3">
            {['features','pricing','for-who'].map(s => (
              <a key={s} href={`#${s}`} onClick={() => setMobileNav(false)}
                className="block text-sm text-text-secondary py-2 capitalize">{s.replace('-',' ')}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <Link href="/auth/login"  className="flex-1 text-center text-sm border border-bg-border rounded-xl py-2.5 text-text-secondary">Login</Link>
              <Link href="/auth/signup" className="flex-1 text-center text-sm bg-brand rounded-xl py-2.5 text-white font-600">Start free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-teal/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-brand rounded-full animate-pulse-slow" />
                <span className="text-brand-light text-xs font-display font-600">17,000+ founders globally • India mein coming</span>
              </div>

              <h1 className="font-display font-800 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
                Apna business ka{' '}
                <span className="glow-text">AI dimag</span>
                <br />WhatsApp pe.
              </h1>
              <p className="text-text-secondary text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                Voice note bhejo. Notion update ho jata hai. GST deadlines yaad rehti hain. Client follow-ups khud ho jaate hain.
                <br /><span className="text-text-primary font-500">Koi naya app nahi — sirf WhatsApp.</span>
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-display font-600 px-7 py-3.5 rounded-xl transition-all hover:shadow-brand active:scale-95 text-base">
                  7 din free try karo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#demo" className="inline-flex items-center gap-2 border border-bg-border hover:border-brand/40 text-text-secondary hover:text-text-primary font-display font-500 px-7 py-3.5 rounded-xl transition-all text-base">
                  Demo dekhein
                </a>
              </div>

              <div className="flex items-center gap-6 text-sm text-text-muted">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" />No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" />UPI accepted</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" />Hindi support</span>
              </div>
            </div>

            {/* WhatsApp mockup */}
            <div id="demo" className="relative">
              <div className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden shadow-card max-w-sm mx-auto">
                {/* WA header */}
                <div className="bg-[#00a884] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-600">Vaani</p>
                    <p className="text-white/70 text-xs">online</p>
                  </div>
                  <div className="ml-auto flex gap-3">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                  </div>
                </div>
                {/* Messages */}
                <div className="px-3 py-4 space-y-3 min-h-[320px] bg-[#0e1621]">
                  {WA_DEMOS.slice(0, demoIdx + 1).map((m, i) => (
                    <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} bubble-in`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                        m.from === 'user'
                          ? 'bg-[#005c4b] text-white rounded-br-sm'
                          : 'bg-[#202c33] text-[#e9edef] rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input bar */}
                <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-[#8696a0]">Message</div>
                  <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              {/* Floating label */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-brand/10 border border-brand/30 rounded-full px-4 py-1.5 text-brand-light text-xs font-display whitespace-nowrap">
                Scroll karo — aur use cases dekhein ↓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations marquee ── */}
      <section className="py-10 border-y border-bg-border overflow-hidden">
        <p className="text-center text-text-muted text-xs font-display font-600 uppercase tracking-widest mb-6">Connected to</p>
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
            <p className="text-brand text-xs font-display font-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">Aapka AI intern — ek message door</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">Sab busy work delegate karo. Team of ten jaisi kaam karo.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="bg-bg-surface border border-bg-border rounded-2xl p-5 hover:border-brand/30 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                {badge && (
                  <span className={`text-xs font-display font-600 px-2 py-0.5 rounded-full mb-2 inline-block ${badge.includes('🇮🇳') ? 'bg-[#FF9933]/15 text-[#FF9933]' : 'bg-brand/10 text-brand-light'}`}>{badge}</span>
                )}
                <h3 className="font-display font-600 text-text-primary mb-2">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For whom ── */}
      <section id="for-who" className="py-24 px-4 sm:px-6 bg-bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">Kaun use karta hai Vaani?</h2>
            <p className="text-text-secondary">Har Indian operator ke liye bana hai.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone, label: 'Startup Founder',
                color: 'brand',
                items: ['Meeting notes → Notion instantly', 'Investor update drafts', 'Team task delegation', 'Weekly summary automations'],
              },
              {
                icon: Building2, label: 'MSME Owner',
                color: 'teal',
                items: ['GST/TDS deadline alerts', 'Client follow-up reminders', 'Expense tracking se receipts', 'GST invoice via voice'],
              },
              {
                icon: Briefcase, label: 'CA Firm / AIF',
                color: 'warning',
                items: ['Multi-client compliance board', 'SEBI AIF quarterly reminders', 'Client KYC checklist automation', 'Investor report drafts'],
              },
            ].map(({ icon: Icon, label, color, items }) => (
              <div key={label} className="bg-bg-surface border border-bg-border rounded-2xl p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color === 'brand' ? 'bg-brand/10' : color === 'teal' ? 'bg-teal/10' : 'bg-warning/10'}`}>
                  <Icon className={`w-6 h-6 ${color === 'brand' ? 'text-brand' : color === 'teal' ? 'text-teal' : 'text-warning'}`} />
                </div>
                <h3 className="font-display font-700 text-text-primary mb-4">{label}</h3>
                <ul className="space-y-2.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── India moat ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-bg-surface border border-bg-border rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-[#FF9933]/10 border border-[#FF9933]/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xl">🇮🇳</span>
              <span className="text-[#FF9933] text-xs font-display font-600">Made for India</span>
            </div>
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-6">
              Notis.ai acha hai. <br />Vaani aapke liye bana hai.
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Hindi/Marathi/Gujarati/Tamil voice support', notis: false, vaani: true },
                { label: 'GST, TDS, Advance Tax deadline alerts', notis: false, vaani: true },
                { label: 'GSTIN-compliant invoice generator', notis: false, vaani: true },
                { label: 'Tally-compatible export', notis: false, vaani: true },
                { label: 'Razorpay + UPI payments (₹ pricing)', notis: false, vaani: true },
                { label: 'SEBI AIF/PMS quarterly reminders', notis: false, vaani: true },
                { label: 'AWS Mumbai data residency (DPDP Act)', notis: false, vaani: true },
                { label: 'Diwali client greeting automation', notis: false, vaani: true },
              ].map(({ label, notis, vaani }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-bg-border last:border-0">
                  <span className="text-sm text-text-secondary">{label}</span>
                  <div className="flex gap-6">
                    <span className="text-xs font-display text-text-muted w-12 text-center">{notis ? '✓' : '✗'}</span>
                    <span className="text-xs font-display text-success w-12 text-center font-600">✓</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-8 mt-4">
              <span className="text-text-muted text-xs">Notis.ai</span>
              <span className="text-success text-xs font-600">Vaani</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 sm:px-6 bg-bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display font-800 text-3xl text-center mb-12">Log kya bol rahe hain</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-bg-surface border border-bg-border rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-warning fill-warning" />)}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="text-text-primary text-sm font-display font-600">{name}</p>
                  <p className="text-text-muted text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand text-xs font-display font-600 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">EA se sasta. Intern se zyada capable.</h2>
            <p className="text-text-secondary">7 din free. Koi credit card nahi. UPI se pay karo.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, per, tasks, target, cta, features, popular }) => (
              <div key={name} className={`relative rounded-2xl p-6 border ${popular ? 'bg-bg-elevated border-brand/40 shadow-brand' : 'bg-bg-surface border-bg-border'}`}>
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-display font-700 px-4 py-1 rounded-full">Most popular</div>
                )}
                <p className="text-text-muted text-xs font-display mb-1">{target}</p>
                <h3 className="font-display font-700 text-text-primary mb-3">{name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-display font-800 text-text-primary">{price}</span>
                  <span className="text-text-muted text-sm">{per}</span>
                </div>
                <p className="text-brand-light text-xs mb-5">{tasks}/month</p>
                <Link href="/auth/signup"
                  className={`block text-center text-sm font-display font-600 py-3 rounded-xl transition-all mb-5 ${popular ? 'bg-brand hover:bg-brand-light text-white hover:shadow-glow-sm' : 'border border-bg-border hover:border-brand/40 text-text-secondary hover:text-text-primary'}`}>
                  {cta}
                </Link>
                <ul className="space-y-2.5">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-6 animate-float">
            <Mic className="w-8 h-8 text-brand" />
          </div>
          <h2 className="font-display font-800 text-3xl sm:text-4xl mb-4">
            Busy work se azaad ho jao.
          </h2>
          <p className="text-text-secondary text-lg mb-8">Vaani ko apna AI intern banao. 7 din free.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-display font-600 px-8 py-4 rounded-xl transition-all hover:shadow-brand text-base">
              Abhi shuru karo — free hai
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-text-muted text-sm mt-4">WhatsApp pe connect hone mein 2 minute lagte hain.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-bg-border py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center"><Mic className="w-3.5 h-3.5 text-white" /></div>
              <span className="font-display font-700">Vaani</span>
            </div>
            <p className="text-text-muted text-sm max-w-xs">Apna business ka AI dimag — WhatsApp pe. Indian founders ke liye banaya gaya.</p>
          </div>
          <div className="flex gap-12 text-sm text-text-muted">
            <div className="space-y-2">
              <p className="font-display font-600 text-text-secondary mb-3">Product</p>
              {['Features', 'Pricing', 'Integrations', 'Changelog'].map(l => <p key={l} className="hover:text-text-primary cursor-pointer transition-colors">{l}</p>)}
            </div>
            <div className="space-y-2">
              <p className="font-display font-600 text-text-secondary mb-3">Legal</p>
              {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(l => <p key={l} className="hover:text-text-primary cursor-pointer transition-colors">{l}</p>)}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-bg-border flex justify-between items-center text-text-muted text-xs">
          <span>© 2025 Vaani. Made with ❤️ in India 🇮🇳</span>
          <span>AWS Mumbai • DPDP Act compliant</span>
        </div>
      </footer>
    </div>
  )
}
