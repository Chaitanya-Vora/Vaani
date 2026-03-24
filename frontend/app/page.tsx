'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, BrainCircuit, Target, Share2, Receipt,
  ArrowRight, CheckCircle, Menu, X, Database,
  Zap, ArrowUpRight, Activity, Play
} from 'lucide-react'

const FEATURES = [
  {
    icon: BrainCircuit, title: 'Just Speak Normally',
    desc: 'No robot commands needed. Talk in English or Hindi, and Vaani figures out exactly what you want to do.',
  },
  {
    icon: Target, title: 'The "I Promise" Tracker',
    desc: 'If you say "I will send this tomorrow", Vaani remembers. It actively pings you the next day to make sure it gets done.',
  },
  {
    icon: Share2, title: 'Instant Contact Saver',
    desc: 'Just snap a photo of a business card. We instantly pull the Name, Number, and Company and save it to your database.',
  },
  {
    icon: Database, title: 'Voice-to-Document Builder',
    desc: 'Rambling voice notes get turned into beautifully structured, formatted Notion pages with clear action items.',
  },
  {
    icon: Receipt, title: 'Voice-Activated Invoicing',
    desc: 'Say what you sold. We instantly generate a perfect, GST-ready PDF invoice and send it directly via WhatsApp.',
  },
  {
    icon: Activity, title: 'Your Personal Dashboard',
    desc: 'See your daily habits, uncompleted tasks, and simple financial overviews without opening clunky software.',
  },
]

const PLANS = [
  {
    name: 'Professional', price: '₹999', per: '/month', tasks: '100 operations',
    target: 'Independent Consultants',
    cta: 'Start Free Trial',
    features: ['Contextual Engine (Eng/Hi)', 'Database Synchronization', '100 tasks/month', 'Calendar Integration'],
    popular: false,
  },
  {
    name: 'Business', price: '₹2,499', per: '/month', tasks: '500 operations',
    target: 'Scaling Organizations',
    cta: 'Start Free Trial',
    features: ['Everything in Pro', 'Commitment Tracking', 'Lead Capture Workflows', 'Structured Documentation', 'Accounting Exports'],
    popular: true,
  },
  {
    name: 'Enterprise', price: 'Custom', per: '', tasks: 'Unlimited',
    target: 'Large Agencies & Firms',
    cta: 'Contact Sales',
    features: ['Everything in Business', 'Custom SLA Automation', 'Dedicated Account Mgr', 'Unlimited Seats', 'Priority Support'],
    popular: false,
  },
]

const WA_DEMOS = [
  { from: 'user', text: '🎙️ [Voice 0:14] — "Please send the commercial proposal to Sharma & Associates tomorrow at 10 AM, and remind me if they haven\'t replied."' },
  { from: 'vaani', text: '🎯 Commitment logged for tomorrow 10:00 AM.\n\n📋 Proposal: Sharma & Associates.\n⏰ Follow-up scheduled for Friday.\n🔗 [View in Command Center]' },
  { from: 'user', text: 'Structure a business plan: An automated auditing platform for CA firms.' },
  { from: 'vaani', text: '✅ Strategy Document Created: *Automated Auditing Platform*\n\nIncludes Market Analysis, Deployment Strategy, and Action Items.\n🔗 [Open in Corporate Library]' },
]

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false)
  const [demoIdx, setDemoIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDemoIdx(i => Math.min(i + 1, WA_DEMOS.length - 1)), 3500)
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
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-body overflow-x-hidden selection:bg-brand selection:text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-zinc-200/50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-[10px] bg-zinc-900 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 tracking-tight text-lg text-zinc-900">Vaani</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-500 font-medium">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#pricing"  className="hover:text-zinc-900 transition-colors">Pricing</a>
            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">Dashboard</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login"  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2">Log in</Link>
            <Link href="/auth/signup" className="text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 px-5 py-2.5 rounded-full transition-all shadow-sm">
              Start Free Trial
            </Link>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden text-zinc-900">
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm rounded-full px-4 py-1.5 mb-8">
              <span className="text-brand text-xs font-semibold tracking-wide">Vaani OS 2.0 is live</span>
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              <Link href="/auth/signup" className="text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors">
                Read the announcement <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <h1 className="font-display font-800 text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight mb-6 text-zinc-900">
              Your AI Intern, <br className="hidden sm:block" />
              <span className="text-zinc-400">One Message Away.</span>
            </h1>
            
            <p className="text-zinc-500 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl font-medium">
              Delegate all your busy work. Note taking, active task management, CRM updates, and invoicing — seamlessly updated from a single voice note.
            </p>

            <div className="flex flex-wrap gap-4 items-center justify-center mb-16">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-semibold px-8 py-4 rounded-full transition-all hover:bg-zinc-800 shadow-xl shadow-zinc-900/10 text-base">
                Start Delegating For Free
              </Link>
              <Link href="#demo" className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-semibold px-8 py-4 rounded-full transition-all hover:bg-zinc-50 hover:border-zinc-300 text-base shadow-sm">
                <Play className="w-4 h-4 fill-current" /> Watch Demo
              </Link>
            </div>
          </motion.div>

          {/* Premium White Mockup */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} id="demo" className="relative max-w-2xl mx-auto w-full">
            <div className="bg-white border border-zinc-200/80 rounded-[2rem] overflow-hidden shadow-2xl relative z-10 mx-auto">
              
              {/* Mockup Header */}
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-center bg-zinc-50/50 backdrop-blur-sm relative">
                <div className="absolute left-5 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-brand flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
                  Vaani Assistant
                </div>
              </div>

              {/* Mockup Body */}
              <div className="px-6 py-8 space-y-6 min-h-[460px] bg-[#fafafa]">
                {WA_DEMOS.slice(0, demoIdx + 1).map((m, i) => (
                  <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-[1.25rem] px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-line shadow-sm border ${
                      m.from === 'user' 
                        ? 'bg-brand text-white border-brand rounded-tr-md' 
                        : 'bg-white border-zinc-200 text-zinc-800 rounded-tl-md shadow-lg shadow-zinc-200/40'
                    }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Decorative blurs behind mockup */}
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-b from-brand/10 to-transparent opacity-50 blur-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── Logos marquee ── */}
      <section className="py-16 border-b border-zinc-100 bg-white relative overflow-hidden">
        <p className="text-center text-zinc-400 text-sm font-semibold mb-8">Trusted by operators using</p>
        <div className="flex animate-marquee gap-16 w-max items-center px-10">
          {['Notion', 'Google Space', 'WhatsApp', 'Slack', 'Zoho CRM', 'Tally', 'Razorpay', 'MS Teams', 'Notion', 'Google Space', 'WhatsApp', 'Slack'].map((name, i) => (
            <span key={i} className="text-zinc-800 text-xl font-display font-bold tracking-tight whitespace-nowrap opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 grayscale hover:grayscale-0">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-32 px-6 relative bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display font-800 text-4xl sm:text-5xl mb-6 tracking-tight text-zinc-900">Built for real work.<br/>Not just conversations.</h2>
            <p className="text-zinc-500 text-xl max-w-2xl mx-auto">One voice message dynamically routes to your CRM, project management, and accounting software instantly.</p>
          </div>
          
          <motion.div variants={containerFramer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div variants={itemFramer} key={title} className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-zinc-900" />
                </div>
                <h3 className="font-display font-700 text-zinc-900 mb-3 text-xl tracking-tight">{title}</h3>
                <p className="text-zinc-500 text-base leading-relaxed font-medium">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Capabilities Layman Section ── */}
      <section className="py-24 px-6 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display font-800 text-4xl sm:text-5xl mb-6 tracking-tight text-zinc-900">How Vaani actually works.</h2>
            <p className="text-zinc-500 text-xl font-medium">No complex setups. Just use WhatsApp like you normally do.</p>
          </div>
          
          <div className="space-y-16">
            {/* Capability 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-[3xl] border border-zinc-100 shadow-sm">
              <div>
                <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm">1</div>
                <h3 className="text-3xl font-display font-800 text-zinc-900 mb-4 tracking-tight">The "I promise to do this" Tracker</h3>
                <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                  Ever told a client "I'll send the quote tomorrow at 2 PM" and completely forgot? 
                  When you send that exact voice note to Vaani, it actively tracks the deadline. The next day at 1:55 PM, it pings your WhatsApp: <em>"Hey, did you send that quote?"</em>
                </p>
              </div>
              <div className="bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 shadow-inner">
                 <div className="bg-white rounded-2xl p-4 shadow-md border border-zinc-100 mb-4 ml-8 transform rotate-1">
                    <p className="text-zinc-800 font-medium">🗣️ "Kal 2 baje proposal send kar dunga Mehta ko."</p>
                 </div>
                 <div className="bg-brand text-white rounded-2xl p-4 shadow-xl border border-brand mr-8 transform -rotate-1">
                    <p className="font-semibold text-sm opacity-80 mb-1">Vaani at 1:55 PM tomorrow:</p>
                    <p className="font-bold">🎯 Deadline Alert! Did you send the proposal to Mehta?</p>
                 </div>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-[3xl] border border-zinc-100 shadow-sm">
              <div className="order-2 md:order-1 bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 shadow-inner flex flex-col items-center">
                 <div className="w-full h-32 bg-white rounded-2xl shadow-sm border border-zinc-200 mb-4 flex items-center justify-center overflow-hidden">
                    <div className="text-zinc-300 font-bold text-lg border-2 border-dashed border-zinc-300 p-4 rounded-xl">Business Card Photo</div>
                 </div>
                 <div className="w-full bg-brand/10 text-brand-dark rounded-2xl p-4 border border-brand/20">
                    <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-brand"/> Contact Saved to CRM</p>
                    <ul className="text-sm space-y-1 font-medium opactity-80">
                      <li>Name: Rahul Sharma</li>
                      <li>Phone: +91 98765 43210</li>
                      <li>Company: Apex Corp</li>
                    </ul>
                 </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm">2</div>
                <h3 className="text-3xl font-display font-800 text-zinc-900 mb-4 tracking-tight">The Instant Contact Scanner</h3>
                <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                  Stop typing names and numbers into your CRM. When you meet someone new, just click a photo of their business card and send it to Vaani. We read the image and instantly structure it into your database.
                </p>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-[3xl] border border-zinc-100 shadow-sm">
              <div>
                <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl mb-6 shadow-sm">3</div>
                <h3 className="text-3xl font-display font-800 text-zinc-900 mb-4 tracking-tight">The "Brain Dump" Documentor</h3>
                <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                  Have a great idea while driving? Send a 3-minute rambling voice note. Vaani doesn't just transcribe it—it perfectly structures it into a beautiful, formatted <strong>Notion Page</strong> with headings, bullet points, and action items.
                </p>
              </div>
              <div className="bg-zinc-50 rounded-[2rem] p-6 border border-zinc-100 shadow-inner">
                 <div className="bg-white rounded-[1.5rem] shadow-xl border border-zinc-200 overflow-hidden transform hover:scale-105 transition-transform duration-300">
                    <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                      <Database className="w-4 h-4 text-black" /> <span className="font-bold text-sm">Notion Database</span>
                    </div>
                    <div className="p-5">
                      <h4 className="font-bold text-xl mb-3">Q3 Marketing Strategy</h4>
                      <div className="w-3/4 h-2 bg-zinc-200 rounded-full mb-2"></div>
                      <div className="w-full h-2 bg-zinc-200 rounded-full mb-2"></div>
                      <div className="w-5/6 h-2 bg-zinc-200 rounded-full mb-4"></div>
                      <p className="font-bold text-sm text-zinc-600 mb-2">Action Items:</p>
                      <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 border-2 border-zinc-400 rounded-sm"></div><div className="w-1/2 h-2 bg-zinc-200 rounded-full"></div></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-zinc-400 rounded-sm"></div><div className="w-1/3 h-2 bg-zinc-200 rounded-full"></div></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Notion Integration Callout ── */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto bg-zinc-900 rounded-[3rem] p-10 sm:p-20 relative text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
              <Database className="w-8 h-8 text-black" />
            </div>
            <h2 className="font-display font-800 text-4xl sm:text-5xl mb-6 tracking-tight text-white">
              Notion Power, without the overhead.
            </h2>
            <p className="text-zinc-400 text-xl leading-relaxed mb-10 font-medium">
              We engineered a deeply opinionated Second Brain framework. Just speak, and Vaani precisely maps your thoughts into connected databases—zero setup required.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-zinc-900 font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 text-base">
              Explore the integrations <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32 px-6 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display font-800 text-4xl sm:text-5xl mb-6 tracking-tight text-zinc-900">More capable than an EA.<br/>More affordable than an intern.</h2>
            <p className="text-zinc-500 text-xl">Start for free. Upgrade when you need more operational bandwidth.</p>
          </div>

          <motion.div variants={containerFramer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8 items-stretch">
            {PLANS.map(({ name, price, per, tasks, target, cta, features, popular }) => (
              <motion.div variants={itemFramer} key={name} className={`relative rounded-[2.5rem] p-8 sm:p-10 flex flex-col ${popular ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20' : 'bg-white border border-zinc-200 text-zinc-900 shadow-sm'}`}>
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-brand/20">Most Popular</div>
                )}
                
                <h3 className="font-display font-700 text-2xl mb-1">{name}</h3>
                <p className={`text-sm mb-8 font-medium ${popular ? 'text-zinc-400' : 'text-zinc-500'}`}>{target}</p>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-display font-800 leading-none tracking-tight">{price}</span>
                  <span className={`text-base font-medium ${popular ? 'text-zinc-400' : 'text-zinc-500'}`}>{per}</span>
                </div>
                
                <Link href={price === 'Custom' ? "mailto:sales@vaani.app" : "/auth/signup"}
                  className={`block text-center text-base font-semibold py-4 rounded-full transition-all mb-10 ${popular ? 'bg-white hover:bg-zinc-100 text-zinc-900' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}>
                  {cta}
                </Link>
                
                <div className="mt-auto">
                  <ul className="space-y-4">
                    {features.map(f => (
                      <li key={f} className={`flex items-start gap-3 text-base font-medium ${popular ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${popular ? 'text-white' : 'text-zinc-900'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-12 sm:gap-8">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 mb-6 text-zinc-900 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-700 tracking-tight text-xl">Vaani</span>
            </Link>
            <p className="text-zinc-500 text-base font-medium leading-relaxed">The premier autonomous operational system engineered explicitly for modern organizations.</p>
          </div>
          
          <div className="flex gap-16">
            <div>
              <h4 className="text-zinc-900 font-bold text-base mb-6">Product</h4>
              <ul className="space-y-4 text-base font-medium text-zinc-500">
                <li><Link href="#features" className="hover:text-zinc-900 transition-colors">OS Architecture</Link></li>
                <li><Link href="/dashboard/setup" className="hover:text-zinc-900 transition-colors">Integrations</Link></li>
                <li><Link href="#features" className="hover:text-zinc-900 transition-colors">Security</Link></li>
                <li><Link href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-900 font-bold text-base mb-6">Company</h4>
              <ul className="space-y-4 text-base font-medium text-zinc-500">
                <li><Link href="mailto:hello@vaani.app" className="hover:text-zinc-900 transition-colors">About Us</Link></li>
                <li><Link href="mailto:hello@vaani.app" className="hover:text-zinc-900 transition-colors">Careers</Link></li>
                <li><Link href="mailto:hello@vaani.app" className="hover:text-zinc-900 transition-colors">Legal</Link></li>
                <li><Link href="mailto:support@vaani.app" className="hover:text-zinc-900 transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-zinc-400 text-sm font-medium">
          <span>© 2026 Vaani Enterprise. All rights reserved.</span>
          <div className="flex gap-8">
            <Link href="mailto:legal@vaani.app" className="hover:text-zinc-600 transition-colors">Privacy Policy</Link>
            <Link href="mailto:legal@vaani.app" className="hover:text-zinc-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
