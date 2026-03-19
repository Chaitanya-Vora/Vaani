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
      'Voice → Notion notes (Hindi/English)',
      'GST / TDS / Advance Tax alerts',
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
      'Sab Starter features +',
      'GST invoice generator (voice → PDF)',
      'Client CRM with Zoho sync',
      'Meeting minutes → action items',
      'Automations (recurring + webhook)',
      'Tally-compatible expense export',
      'Blog, newsletter, social media drafts',
      '3 team members',
      'Diwali / festival greeting automation',
    ],
    notIncluded: ['SEBI AIF/PMS reminders', 'Multi-client compliance board'],
  },
  {
    id: 'pro', name: 'Pro / CA & AIF', price: 2499, icon: Crown,
    tagline: 'CA firms & SEBI regulated entities',
    tasks: 'Unlimited tasks',
    features: [
      'Sab Growth features +',
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
      window.open('mailto:hello@vaani.app?subject=Pro Plan Inquiry', '_blank')
      return
    }
    setUpgrading(planId)
    try {
      const res: any = await api.billing.subscribe(planId)
      if (res.short_url) window.location.href = res.short_url
    } catch (e: any) {
      alert('Payment shuru karne mein problem: ' + e.message)
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
        <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Billing & Plans</h1>
        <p className="text-text-secondary text-sm">UPI, debit/credit card — sab accepted. Cancel anytime.</p>
      </div>

      {/* Trial banner */}
      {user?.plan_status === 'trial' && (
        <div className="bg-brand/8 border border-brand/25 rounded-xl p-5 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">
              Free trial — {daysLeft} din baaki hain
            </p>
            <p className="text-text-secondary text-sm">
              Trial khatam hone se pehle plan choose karo. Koi data loss nahi hoga.
            </p>
          </div>
        </div>
      )}

      {/* Current usage */}
      <Card className="mb-8 bg-bg-elevated">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-text-muted text-xs font-display font-600 uppercase tracking-wider mb-1">Current plan</p>
            <p className="font-display font-700 text-xl text-text-primary capitalize">{currentPlan}</p>
            <p className="text-text-secondary text-sm mt-0.5">
              {user?.tasks_used || 0} / {user?.tasks_limit === 999999 ? 'unlimited' : user?.tasks_limit} tasks used this month
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-xs mb-1">Status</p>
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
            <div key={id} className={`relative rounded-2xl border p-6 flex flex-col ${
              popular ? 'bg-bg-elevated border-brand/40 shadow-brand' : 'bg-bg-surface border-bg-border'
            }`}>
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs font-display font-700 px-4 py-1 rounded-full whitespace-nowrap">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${popular ? 'bg-brand/20' : 'bg-bg-border'}`}>
                  <Icon className={`w-4.5 h-4.5 ${popular ? 'text-brand' : 'text-text-muted'}`} />
                </div>
                <div>
                  <p className="font-display font-700 text-text-primary">{name}</p>
                  <p className="text-text-muted text-xs">{tagline}</p>
                </div>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-display font-800 text-text-primary">₹{price.toLocaleString('en-IN')}</span>
                <span className="text-text-muted text-sm">/maah</span>
              </div>
              <p className="text-brand-light text-xs mb-5">{tasks}</p>

              <Button
                className="w-full mb-5"
                variant={isCurrent ? 'ghost' : popular ? 'primary' : 'ghost'}
                disabled={isCurrent}
                loading={upgrading === id}
                onClick={() => !isCurrent && subscribe(id)}
              >
                {isCurrent ? '✓ Current plan' : id === 'pro' ? 'Sales se baat karo' : `${name} choose karo`}
              </Button>

              <ul className="space-y-2 flex-1">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {notIncluded.slice(0, 2).map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-text-muted opacity-50">
                    <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">✗</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <Card>
        <h3 className="font-display font-600 text-text-primary mb-4">Frequently asked questions</h3>
        <div className="space-y-4">
          {[
            { q: 'Kya cancel kar sakta hoon?', a: 'Haan, kisi bhi time. Koi cancellation fee nahi. Billing period khatam tak access milega.' },
            { q: 'UPI se pay kar sakte hain?', a: 'Haan — Razorpay ke through UPI, debit card, credit card, net banking sab accepted hai.' },
            { q: 'Data India mein rahega?', a: 'Pro plan mein AWS Mumbai (ap-south-1) data residency hai. DPDP Act compliant.' },
            { q: 'Task kya hota hai?', a: 'Har WhatsApp message jo Vaani process karta hai wo 1 task hai — note save, reminder set, invoice create, sab.' },
          ].map(({ q, a }) => (
            <div key={q} className="pb-4 border-b border-bg-border last:border-0 last:pb-0">
              <p className="font-display font-600 text-text-primary text-sm mb-1.5">{q}</p>
              <p className="text-text-secondary text-sm">{a}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  )
}
