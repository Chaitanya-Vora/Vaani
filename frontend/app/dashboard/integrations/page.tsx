'use client'
import { useEffect, useState } from 'react'
import { Plug, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Badge, Spinner } from '@/components/ui'

const INTEGRATIONS = [
  {
    id: 'notion', name: 'Notion', icon: '📓',
    desc: 'Your Operational Second Brain. All notes, tasks, CRM entries, and compliance records sync securely here. REQUIRED.',
    category: 'Core', required: true,
    connectUrl: (userId: string) => `/api/auth/notion/connect?state=${userId}`,
  },
  {
    id: 'google_calendar', name: 'Google Workspace', icon: '📅',
    desc: 'Tasks are created in Google Tasks, calendar events are scheduled, and emails are instantly drafted in Gmail.',
    category: 'Productivity', required: false,
    connectUrl: (userId: string) => `/api/auth/google/connect?state=${userId}`,
  },
  {
    id: 'zoho_crm', name: 'Zoho CRM', icon: '👥',
    desc: 'Client interactions sync natively to Zoho. The most adopted CRM for scaling organizations.',
    category: 'CRM', required: false,
    connectUrl: () => '#',
    comingSoon: false,
  },
  {
    id: 'tally', name: 'Tally', icon: '📊',
    desc: 'Export expense data automatically in Tally XML format. Ready for direct accountant import.',
    category: 'Accounting', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', icon: '💬',
    desc: 'Your primary interface. Connect your number so Vaani can act proactively as your EA.',
    category: 'Messaging', required: true,
    connectUrl: () => 'https://business.whatsapp.com',
  },
  {
    id: 'linkedin', name: 'LinkedIn', icon: '💼',
    desc: 'Publish drafted executive updates and thought leadership directly to your LinkedIn feed.',
    category: 'Social', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'razorpay', name: 'Razorpay', icon: '💳',
    desc: 'Track invoice payment statuses and receive real-time WhatsApp alerts upon settlement.',
    category: 'Payments', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'slack', name: 'Slack', icon: '💬',
    desc: 'Deploy Vaani securely within your Slack workspace to broadcast updates to your team.',
    category: 'Messaging', required: false,
    connectUrl: () => '#',
    comingSoon: true,
  },
  {
    id: 'universal_hub', name: 'Make & Zapier (800+ Apps)', icon: '⚡',
    desc: 'Gain instant access to 800+ applications. Use Vaani as your universal execution endpoint.',
    category: 'Universal', required: false,
    connectUrl: () => 'https://make.com',
    comingSoon: false,
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

  const categories = Array.from(new Set(INTEGRATIONS.map(i => i.category)))

  return (
    <DashboardShell user={user}>
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Integrations & App Store</h1>
        <p className="text-zinc-500 text-base font-medium">
          {connected.length} of {INTEGRATIONS.filter(i => !i.comingSoon).length} enterprise modules securely connected
        </p>
      </div>

      {!isConnected('notion') && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-800 text-lg text-red-600 mb-1">Notion Connection Required</p>
            <p className="text-red-500 text-sm font-medium">Notion acts as Vaani's long-term memory. Notes, tasks, and CRM leads are structured securely there. Please authenticate to use Vaani.</p>
          </div>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} className="mb-10">
          <p className="text-zinc-400 text-xs font-display font-800 uppercase tracking-widest mb-4 pl-1">{cat}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INTEGRATIONS.filter(i => i.category === cat).map(intg => {
              const conn = isConnected(intg.id)
              return (
                <Card key={intg.id} className={`flex flex-col gap-5 p-6 rounded-3xl ${conn ? 'border-brand/40 shadow-brand/10 bg-brand/5' : intg.required ? 'border-zinc-300 shadow-sm bg-white' : 'border-zinc-200 bg-white shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl bg-white shadow-sm w-12 h-12 flex items-center justify-center rounded-xl border border-zinc-100">{intg.icon}</span>
                      <div>
                        <div className="flex flex-col">
                          <p className="font-display font-800 tracking-tight text-zinc-900 text-lg">{intg.name}</p>
                          {intg.required && <span className="text-[10px] text-brand font-bold uppercase tracking-wider mt-0.5">Required Module</span>}
                        </div>
                      </div>
                    </div>
                    {conn ? (
                      <CheckCircle className="w-6 h-6 text-brand flex-shrink-0" />
                    ) : intg.comingSoon ? (
                      <Badge color="muted" className="text-[10px] uppercase font-bold tracking-wider">Coming Soon</Badge>
                    ) : null}
                  </div>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed flex-1">{intg.desc}</p>
                  <Button
                    size="md"
                    variant={conn ? 'primary' : intg.comingSoon ? 'ghost' : 'ghost'}
                    disabled={intg.comingSoon || conn}
                    onClick={() => handleConnect(intg)}
                    className={`w-full font-bold ${conn ? 'bg-brand hover:bg-brand text-white opacity-80' : intg.comingSoon ? 'bg-zinc-100 cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                  >
                    {conn ? '✓ Connected Securely' : intg.comingSoon ? 'In Development' : 'Authenticate Integration'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      <Card className="bg-zinc-50 border-zinc-200 mt-6 shadow-sm p-6 rounded-3xl">
        <div className="flex gap-4">
          <Plug className="w-6 h-6 text-zinc-900 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-800 text-xl text-zinc-900 mb-2">Custom Webhook Infrastructure</p>
            <p className="text-zinc-500 font-medium text-sm leading-relaxed">
              Any application utilizing standard webhooks — Zapier, Make, n8n — integrates natively with Vaani payloads. 
              Configure your endpoint coordinates directly inside the Automations module.
            </p>
          </div>
        </div>
      </Card>
    </DashboardShell>
  )
}
