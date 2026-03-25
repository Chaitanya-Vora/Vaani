'use client'
import { useEffect, useState } from 'react'
import { Zap, Plus, Trash2, Play, Clock, Webhook, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Input, Select, Badge, Spinner, Empty, Toggle } from '@/components/ui'

const CRON_PRESETS = [
  { value: '0 9 * * 1', label: 'Every Monday at 9 AM' },
  { value: '0 9 1 * *', label: '1st of every month' },
  { value: '0 9 * * *', label: 'Every day at 9 AM' },
  { value: '0 18 * * 5', label: 'Every Friday at 6 PM' },
  { value: 'custom',    label: 'Custom cron expression...' },
]

export default function AutomationsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [autos,   setAutos]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', instruction: '', trigger_type: 'recurring', cron_expression: '0 9 * * 1' })
  const [showForm, setShowForm] = useState(false)
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const load = async () => {
    const [u, a] = await Promise.all([api.dashboard.me(), api.automations.list()])
    setUser(u); setAutos(a as any[])
  }
  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const create = async () => {
    setCreating(true)
    try { await api.automations.create(form); await load(); setShowForm(false) }
    catch (e: any) { alert(e.message) }
    finally { setCreating(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    await api.automations.delete(id); setAutos(a => a.filter(x => x.id !== id))
  }

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const canUse = user?.plan !== 'starter'

  return (
    <DashboardShell user={user}>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Active Automations</h1>
          <p className="text-zinc-500 font-medium text-base">Set it and forget it — Vaani actively works in the background.</p>
        </div>
        {canUse && <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-2" /> New Automation</Button>}
      </div>

      {!canUse && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 flex gap-4 shadow-sm">
          <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-800 text-lg text-zinc-900 mb-1">Automations require the Growth Plan</p>
            <p className="text-zinc-600 font-medium text-sm mb-4">Set up recurring reminders, monthly metric reports, and automated CRM updates.</p>
            <Button size="sm" onClick={() => window.location.href = '/dashboard/billing'}>Upgrade for ₹799/month</Button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="mb-8 border-zinc-200 shadow-xl shadow-zinc-200/40 bg-white">
          <h3 className="font-display font-800 text-xl text-zinc-900 mb-5">Create New Automation</h3>
          <div className="space-y-5">
            <Input label="Automation Name" placeholder="e.g. Weekly Executive Summary" value={form.name} onChange={set('name')} />
            <div>
              <label className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2 block">
                Instruction (Write in natural language)
              </label>
              <textarea value={form.instruction} onChange={set('instruction')}
                placeholder="Generate a summary of all overdue tasks and CRM updates for the week and send it to me via WhatsApp."
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/60 transition-all w-full font-body text-sm resize-none h-28" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Trigger Mechanism" value={form.trigger_type} onChange={set('trigger_type')}
                options={[
                  { value: 'recurring', label: '🔄 Scheduled (Cron)' },
                  { value: 'webhook',   label: '🔗 External Webhook' },
                ]} />
              {form.trigger_type === 'recurring' && (
                <Select label="Execution Schedule" value={form.cron_expression} onChange={set('cron_expression')} options={CRON_PRESETS} />
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={create} loading={creating} size="md">Deploy Automation</Button>
              <Button variant="ghost" size="md" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {autos.length === 0 ? (
        <Empty icon={Zap} title="No active automations"
          description="Deploy recurring reminders, weekly intelligence reports, and integrations."
          action={canUse ? <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Create first automation</Button> : undefined} />
      ) : (
        <div className="space-y-4">
          {autos.map((a: any) => (
            <Card key={a.id} className="flex items-start gap-4 hover:border-zinc-300 transition-all group p-5 bg-white border-zinc-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 border border-zinc-200">
                {a.trigger_type === 'webhook' ? <Webhook className="w-5 h-5 text-zinc-900" /> : <Clock className="w-5 h-5 text-zinc-900" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-display font-800 text-lg text-zinc-900 tracking-tight">{a.name}</p>
                  <Badge color={a.is_active ? 'success' : 'muted'} className="text-[10px] uppercase tracking-wider">{a.is_active ? 'Active' : 'Paused'}</Badge>
                </div>
                <p className="text-zinc-600 font-medium text-sm truncate mb-3">{a.instruction}</p>
                <div className="flex items-center gap-5 text-xs font-semibold text-zinc-400">
                  <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" />{a.run_count || 0} executions</span>
                  {a.cron_expression && <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-600">{a.cron_expression}</span>}
                  {a.last_run_at && <span>Last: {new Date(a.last_run_at).toLocaleDateString('en-IN')}</span>}
                </div>
                {a.webhook_url && (
                  <p className="text-brand text-xs mt-3 font-mono break-all bg-brand/5 p-2 rounded-lg border border-brand/10">{window.location.origin}{a.webhook_url}</p>
                )}
              </div>
              <button onClick={() => del(a.id)} className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0 bg-zinc-50 p-2 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Examples */}
      <Card className="mt-8 bg-zinc-50 border-zinc-200">
        <h3 className="font-display font-800 text-xl text-zinc-900 mb-5">Popular Automation Blueprints 💡</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: 'Weekly Cashflow Summary', when: 'Every Friday at 6 PM', icon: '💰' },
            { name: 'Tax Audit Preparation Ping', when: '15th of every month', icon: '📋' },
            { name: 'Automated CRM Follow-ups', when: 'Every Monday at 9 AM', icon: '👥' },
            { name: 'Draft Investor Updates', when: '1st of every month', icon: '📈' },
          ].map(e => (
            <div key={e.name} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 shadow-sm transition-all cursor-pointer group"
              onClick={() => { setForm(f => ({ ...f, name: e.name })); setShowForm(true) }}>
              <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{e.icon}</span>
              <div>
                <p className="text-zinc-900 text-sm font-display font-800 tracking-tight">{e.name}</p>
                <p className="text-zinc-500 font-medium text-xs mt-0.5">{e.when}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  )
}
