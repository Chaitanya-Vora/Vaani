'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner, Button, Empty } from '@/components/ui'

const TYPE_COLOR: Record<string, 'brand'|'warning'|'teal'|'muted'|'danger'> = {
  GST: 'brand', TDS: 'warning', 'Income Tax': 'teal', ROC: 'muted', SEBI: 'danger', PF: 'success' as any,
}

export default function CompliancePage() {
  const [user,       setUser]       = useState<any>(null)
  const [items,      setItems]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<'all'|'urgent'|'upcoming'>('all')

  useEffect(() => {
    Promise.all([api.dashboard.me(), api.dashboard.compliance()])
      .then(([u, c]) => { setUser(u); setItems(c) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(c => {
    if (filter === 'urgent')   return c.days_until <= 7
    if (filter === 'upcoming') return c.days_until > 7 && c.days_until <= 30
    return true
  })

  const urgentCount   = items.filter(c => c.days_until <= 7).length
  const overdueCount  = items.filter(c => c.is_overdue).length

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  return (
    <DashboardShell user={user}>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Compliance Calendar</h1>
          <p className="text-text-secondary text-sm">GST, TDS, Advance Tax, ROC, SEBI — sab ek jagah</p>
        </div>
        <div className="flex gap-2">
          {(['all','urgent','upcoming'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-display font-600 px-3 py-1.5 rounded-lg transition-all capitalize ${
                filter === f ? 'bg-brand/15 text-brand-light border border-brand/30' : 'text-text-muted hover:text-text-secondary border border-bg-border'
              }`}>
              {f === 'urgent' ? `Urgent (${urgentCount})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total upcoming', val: items.length, color: 'text-text-primary' },
          { label: 'Due this week', val: urgentCount, color: urgentCount > 0 ? 'text-warning' : 'text-text-primary' },
          { label: 'Overdue', val: overdueCount, color: overdueCount > 0 ? 'text-danger' : 'text-success' },
          { label: 'Filed ✓', val: 0, color: 'text-success' },
        ].map(({ label, val, color }) => (
          <Card key={label} className="text-center py-4">
            <p className={`text-2xl font-display font-700 ${color}`}>{val}</p>
            <p className="text-text-muted text-xs mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-brand/5 border border-brand/15 rounded-xl p-4 mb-6 flex gap-3">
        <AlertCircle className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
        <p className="text-text-secondary text-sm">
          Vaani automatically WhatsApp pe remind karta hai — <span className="text-text-primary">3 din pehle, 1 din pehle, aur din par.</span>{' '}
          Aapko kuch nahi karna. Bas Done mark karo.
        </p>
      </div>

      {/* Compliance list */}
      {filtered.length === 0 ? (
        <Empty icon={CheckCircle} title="Sab clear hai!" description="Is filter mein koi compliance deadline nahi hai." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-bg-border bg-bg-elevated">
                  {['Filing', 'Type', 'Period', 'Due Date', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-display font-600 text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const daysLeft = c.days_until
                  const statusColor = c.is_overdue ? 'danger' : daysLeft <= 1 ? 'danger' : daysLeft <= 3 ? 'warning' : 'success'
                  const statusLabel = c.is_overdue ? 'Overdue' : daysLeft === 0 ? 'Aaj!' : `${daysLeft}d left`
                  return (
                    <tr key={c.id} className="border-b border-bg-border hover:bg-bg-elevated/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-text-primary text-sm font-display font-500">{c.description?.split(':')[0]}</p>
                        <p className="text-text-muted text-xs mt-0.5">{c.description?.split(':')[1]?.trim()}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={TYPE_COLOR[c.type?.split('_')[0]] || 'muted'}>{c.type?.split('_')[0] || 'Other'}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-sm">{c.period}</td>
                      <td className="px-4 py-3.5 text-text-secondary text-sm font-mono">
                        {new Date(c.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={statusColor as any}>{statusLabel}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <button className="text-xs text-text-muted hover:text-success transition-colors font-display">Mark Done</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-text-muted text-xs mt-4 text-center">
        Compliance data Indian FY {new Date().getFullYear()}-{String(new Date().getFullYear() + 1).slice(2)} ke liye calculate kiya gaya hai.
        Always verify with your CA.
      </p>
    </DashboardShell>
  )
}
