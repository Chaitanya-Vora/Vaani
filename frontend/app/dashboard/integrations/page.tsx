'use client'
import { useEffect, useState } from 'react'
import { Plug, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Spinner } from '@/components/ui'

const INTEGRATIONS = [
  {
    id: 'notion', name: 'Notion', icon: '📓',
    desc: 'Vaani Second Brain — notes, tasks, CRM, compliance sab yahan save hota hai. REQUIRED.',
    category: 'Core', required: true,
    connectUrl: (userId: string) => `/api/auth/notion/connect?state=${userId}`,
  },
  {
    id: 'google_calendar', name: 'Google Calendar + Gmail', icon: '📅',
    desc: 'Tasks Google Tasks mein add hote hain, calendar events create hote hain, emails draft hoti hain.',
    category: 'Productivity', required: false,
    connectUrl: (userId: string) => `/api/auth/google/connect?state=${userId}`,
  },
  {
    id: 'zoho_crm', name: 'Zoho CRM', icon: '👥',
    desc: 'Client interactions Zoho mein sync hoti hain. Indian businesses ke liye most popular CRM.',
    category: 'CRM', required: false,
    connectUrl: () => '#',
    comingSoon: false,
  },
  {
    id: 'tally', name: 'Tally', icon: '📊',
    desc: 'Expense data Tally XML format mein export karo. CA ke liye direct import ready.',
    category: 'Accounting', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', icon: '💬',
    desc: 'Aapka primary channel. Number connect karo taaki Vaani aapko messages bhej sake.',
    category: 'Messaging', required: true,
    connectUrl: () => 'https://business.whatsapp.com',
  },
  {
    id: 'linkedin', name: 'LinkedIn', icon: '💼',
    desc: 'Draft kiye gaye posts directly LinkedIn pe publish karo.',
    category: 'Social', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'razorpay', name: 'Razorpay', icon: '💳',
    desc: 'Invoice payment status track karo. Payment received alerts WhatsApp pe.',
    category: 'Payments', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'slack', name: 'Slack', icon: '💬',
    desc: 'Vaani ko Slack se bhi use karo — team ke saath broadcast karo.',
    category: 'Messaging', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
]

export default function IntegrationsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    api.dashboard.me().then(setUser).catch(console.error).finally(() => setLoading(false))
  }, [])

  const connected: string[] = user?.connected_integrations || []
  const isConnected = (id: string) => connected.includes(id)

  const handleConnect = (intg: typeof INTEGRATIONS[0]) => {
    if (intg.comingSoon) return
    const url = intg.connectUrl(user?.id || '')
    if (url.startsWith('/api')) {
      window.location.href = `${apiBase}${url}`
    } else {
      window.open(url, '_blank')
    }
  }

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))]

  return (
    <DashboardShell user={user}>
      <div className="mb-6">
        <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Integrations</h1>
        <p className="text-text-secondary text-sm">
          {connected.length} of {INTEGRATIONS.filter(i => !i.comingSoon).length} connected
        </p>
      </div>

      {!isConnected('notion') && (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">Notion connect karna zaroori hai</p>
            <p className="text-text-secondary text-sm">Notion Vaani ka brain hai — notes, tasks, CRM sab wahan save hota hai. Pehle yeh connect karo.</p>
          </div>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} className="mb-8">
          <p className="text-text-muted text-xs font-display font-600 uppercase tracking-widest mb-3">{cat}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.filter(i => i.category === cat).map(intg => {
              const conn = isConnected(intg.id)
              return (
                <Card key={intg.id} className={`flex flex-col gap-4 ${conn ? 'border-success/30' : intg.required ? 'border-brand/20' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{intg.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-600 text-text-primary text-sm">{intg.name}</p>
                          {intg.required && <span className="text-xs text-brand-light bg-brand/10 px-1.5 py-0.5 rounded">Required</span>}
                        </div>
                      </div>
                    </div>
                    {conn ? (
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    ) : intg.comingSoon ? (
                      <Badge color="muted">Soon</Badge>
                    ) : null}
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed flex-1">{intg.desc}</p>
                  <Button
                    size="sm"
                    variant={conn ? 'success' : intg.comingSoon ? 'ghost' : 'primary'}
                    disabled={intg.comingSoon || conn}
                    onClick={() => handleConnect(intg)}
                    className="w-full"
                  >
                    {conn ? '✓ Connected' : intg.comingSoon ? 'Coming soon' : 'Connect karo'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      <Card className="bg-bg-elevated mt-4">
        <div className="flex gap-3">
          <Plug className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">800+ apps via Webhook</p>
            <p className="text-text-muted text-sm">
              Koi bhi app jo webhooks support karta hai — Zapier, Make, n8n — sab Vaani ke saath kaam karta hai.
              Automations tab mein webhook URL milega.
            </p>
          </div>
        </div>
      </Card>
    </DashboardShell>
  )
}
