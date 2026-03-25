'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Zap, Crown, Rocket, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Spinner } from '@/components/ui'

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 299, icon: Rocket,
    tagline: 'Solo founders & freelancers',
    tasks: '50 tasks/month',
    features: [
      'WhatsApp + Telegram bot',
      'Voice → Notion notes',
      'GST / TDS Alert Engine',
      'Task & reminder creation',
      'Google Calendar sync',
      'Basic Notion Second Brain',
      '7-day free trial',
    ],
    notIncluded: ['GST Invoice generator', 'Automations', 'Team members', 'SEBI reminders'],
  },
  {
    id: 'growth', name: 'Growth', price: 799, icon: Zap,
    tagline: 'MSME owners & growing teams',
    tasks: '200 tasks/month',
    popular: true,
    features: [
      'All Starter features +',
      'GST invoice generator (voice → PDF)',
      'Client CRM with Zoho sync',
      'Meeting minutes → action items',
      'Automations (recurring + webhook)',
      'Tally-compatible expense export',
      'Blog, newsletter, social media drafts',
      '3 team members',
      'Automated festival greetings',
    ],
    notIncluded: ['SEBI AIF/PMS reminders', 'Multi-client compliance board'],
  },
  {
    id: 'pro', name: 'Enterprise', price: 2499, icon: Crown,
    tagline: 'CA firms & scaled entities',
    tasks: 'Unlimited tasks',
    features: [
      'All Growth features +',
      'Multi-client compliance dashboard',
      'SEBI AIF / PMS quarterly reminders',
      'Investor update drafting from voice',
      'KYC / onboarding checklist automation',
      '10 team members',
      'WhatsApp voice call mode',
      'AWS Mumbai data residency (DPDP Act)',
      'Priority WhatsApp support',
      'On-demand usage at API cost',
    ],
    notIncluded: [],
  },
]

export default function BillingPage() {
  const [user,    setUser]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    api.dashboard.me().then(setUser).catch(console.error).finally(() => setLoading(false))
  }, [])

  const subscribe = async (planId: string) => {
    if (planId === 'pro') {
      window.open('mailto:hello@vaani.app?subject=Enterprise Plan Inquiry', '_blank')
      return
    }
    setUpgrading(planId)
    try {
      const res: any = await api.billing.subscribe(planId)
      if (res.short_url) window.location.href = res.short_url
    } catch (e: any) {
      alert('Payment initiation failed: ' + e.message)
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const currentPlan = user?.plan || 'starter'
  const trialEnds   = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const daysLeft    = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : 0

  return (
    <DashboardShell user={user}>
      <div className="mb-6">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-1">Billing & Plans</h1>
        <p className="text-zinc-500 font-medium text-sm">UPI, debit/credit card — all accepted. Cancel anytime.</p>
      </div>

      {/* Trial banner */}
      {user?.plan_status === 'trial' && (
        <div className="bg-brand/5 border border-brand/20 rounded-xl p-5 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-700 text-zinc-900 mb-1">
              Trial Active — {daysLeft} days remaining
            </p>
            <p className="text-zinc-500 text-sm font-medium">
              Choose a plan before your trial ends. Zero data loss guaranteed.
            </p>
          </div>
        </div>
      )}

      {/* Current usage */}
      <Card className="mb-8 bg-zinc-50 border-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-zinc-400 text-xs font-display font-700 uppercase tracking-widest mb-1">Current plan</p>
            <p className="font-display font-800 text-2xl text-zinc-900 capitalize">{currentPlan}</p>
            <p className="text-zinc-500 font-medium text-sm mt-0.5">
              {user?.tasks_used || 0} / {user?.tasks_limit === 999999 ? 'unlimited' : user?.tasks_limit} tasks used this month
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 font-bold text-xs mb-1 uppercase tracking-wider">Status</p>
            <Badge color={user?.plan_status === 'active' ? 'success' : user?.plan_status === 'trial' ? 'warning' : 'muted'}>
              {user?.plan_status === 'trial' ? `Trial — ${daysLeft}d left` : user?.plan_status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Plans grid */}
      <div className="grid sm:grid-cols-3 gap-5 mb-8">
        {PLANS.map(({ id, name, price, icon: Icon, tagline, tasks, popular, features, notIncluded }) => {
          const isCurrent = currentPlan === id
          return (
            <div key={id} className={`relative rounded-3xl border p-8 flex flex-col ${
              popular ? 'bg-zinc-900 text-white shadow-2xl border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
            }`}>
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-display font-800 px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-brand/20">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${popular ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'} border`}>
                  <Icon className={`w-5 h-5 ${popular ? 'text-white' : 'text-zinc-900'}`} />
                </div>
                <div>
                  <p className={`font-display font-800 tracking-tight text-lg ${popular ? 'text-white' : 'text-zinc-900'}`}>{name}</p>
                  <p className={`text-xs font-medium ${popular ? 'text-zinc-400' : 'text-zinc-500'}`}>{tagline}</p>
                </div>
              </div>

              <div className="mb-2">
                <span className={`text-4xl font-display font-800 tracking-tight ${popular ? 'text-white' : 'text-zinc-900'}`}>₹{price.toLocaleString('en-IN')}</span>
                <span className={`text-sm font-medium ${popular ? 'text-zinc-400' : 'text-zinc-500'}`}>/month</span>
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-6 ${popular ? 'text-brand-light' : 'text-brand'}`}>{tasks}</p>

              <button
                className={`w-full mb-8 font-semibold text-sm py-3 rounded-xl transition-all ${
                  isCurrent ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 
                  popular ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
                disabled={isCurrent || upgrading === id}
                onClick={() => !isCurrent && subscribe(id)}
              >
                {upgrading === id ? 'Processing...' : isCurrent ? '✓ Current plan' : id === 'pro' ? 'Contact Sales' : `Upgrade to ${name}`}
              </button>

              <ul className="space-y-3 flex-1">
                {features.map(f => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm font-medium ${popular ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${popular ? 'text-brand' : 'text-zinc-900'}`} />
                    {f}
                  </li>
                ))}
                {notIncluded.slice(0, 2).map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-medium opacity-40">
                    <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center font-bold">✗</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <Card className="bg-white border-zinc-200">
        <h3 className="font-display font-800 text-xl text-zinc-900 mb-6">Frequently asked questions</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes, absolutely. No cancellation fees. You will retain access until the end of your billing cycle.' },
            { q: 'Do you accept UPI?', a: 'Yes — we use Razorpay which accepts UPI, Debit Cards, Credit Cards, and Net Banking natively.' },
            { q: 'Does data stay in India?', a: 'Enterprise plans utilize AWS Mumbai (ap-south-1) data residency, strictly DPDP Act compliant.' },
            { q: 'What counts as a "task"?', a: 'Every WhatsApp message processed by Vaani counts as 1 task (saving notes, creating reminders, generating invoices).' },
          ].map(({ q, a }) => (
            <div key={q}>
              <p className="font-display font-700 text-zinc-900 text-sm mb-2">{q}</p>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  )
}
