'use client'
import { useEffect, useState } from 'react'
import { Zap, Plus, Trash2, Play, Clock, Webhook, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Input, Select, Badge, Spinner, Empty, Toggle } from '@/components/ui'

const CRON_PRESETS = [
  { value: '0 9 * * 1', label: 'Har Monday 9 AM' },
  { value: '0 9 1 * *', label: 'Har mahine 1st' },
  { value: '0 9 * * *', label: 'Har din 9 AM' },
  { value: '0 18 * * 5', label: 'Har Friday 6 PM' },
  { value: 'custom',    label: 'Custom cron...' },
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
    if (!confirm('Delete karo?')) return
    await api.automations.delete(id); setAutos(a => a.filter(x => x.id !== id))
  }

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const canUse = user?.plan !== 'starter'

  return (
    <DashboardShell user={user}>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Automations</h1>
          <p className="text-text-secondary text-sm">Set it and forget it — Vaani kaam karta rahega</p>
        </div>
        {canUse && <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4" /> New automation</Button>}
      </div>

      {!canUse && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 mb-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">Automations Growth plan mein available hain</p>
            <p className="text-text-secondary text-sm mb-3">Recurring reminders, monthly reports, festival greetings — sab automate karo.</p>
            <Button size="sm" onClick={() => window.location.href = '/dashboard/billing'}>Upgrade karo — ₹799/maah</Button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="mb-6 border-brand/30">
          <h3 className="font-display font-600 text-text-primary mb-4">Naya automation</h3>
          <div className="space-y-4">
            <Input label="Naam" placeholder="Weekly expense summary" value={form.name} onChange={set('name')} />
            <div>
              <label className="text-text-secondary text-sm font-display font-500 mb-1.5 block">
                Instruction (natural language mein likho)
              </label>
              <textarea value={form.instruction} onChange={set('instruction')}
                placeholder="Generate karo is week ke sab expenses ka summary aur WhatsApp pe bhejo."
                className="bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand/60 transition-all w-full font-body text-sm resize-none h-24" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Trigger type" value={form.trigger_type} onChange={set('trigger_type')}
                options={[
                  { value: 'recurring', label: '🔄 Recurring (schedule)' },
                  { value: 'webhook',   label: '🔗 Webhook' },
                ]} />
              {form.trigger_type === 'recurring' && (
                <Select label="Schedule" value={form.cron_expression} onChange={set('cron_expression')} options={CRON_PRESETS} />
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={create} loading={creating} size="sm">Create karo</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {autos.length === 0 ? (
        <Empty icon={Zap} title="Koi automation nahi abhi tak"
          description="Recurring reminders, weekly reports, festival greetings — ek baar set karo."
          action={canUse ? <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />Pehla automation banao</Button> : undefined} />
      ) : (
        <div className="space-y-3">
          {autos.map((a: any) => (
            <Card key={a.id} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                {a.trigger_type === 'webhook' ? <Webhook className="w-4 h-4 text-brand" /> : <Clock className="w-4 h-4 text-brand" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-display font-600 text-text-primary">{a.name}</p>
                  <Badge color={a.is_active ? 'success' : 'muted'}>{a.is_active ? 'Active' : 'Paused'}</Badge>
                </div>
                <p className="text-text-secondary text-xs truncate mb-1.5">{a.instruction}</p>
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><Play className="w-3 h-3" />{a.run_count || 0} runs</span>
                  {a.cron_expression && <span className="font-mono">{a.cron_expression}</span>}
                  {a.last_run_at && <span>Last: {new Date(a.last_run_at).toLocaleDateString('en-IN')}</span>}
                </div>
                {a.webhook_url && (
                  <p className="text-brand-light text-xs mt-1 font-mono break-all">{window.location.origin}{a.webhook_url}</p>
                )}
              </div>
              <button onClick={() => del(a.id)} className="text-text-muted hover:text-danger transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Examples */}
      <Card className="mt-6 bg-bg-elevated">
        <h3 className="font-display font-600 text-text-primary mb-4">Popular automation ideas 💡</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Weekly expense summary', when: 'Har Friday 6 PM', icon: '💰' },
            { name: 'GSTR-3B reminder set karo', when: '15th ko har mahine', icon: '📋' },
            { name: 'Client follow-up list', when: 'Har Monday 9 AM', icon: '👥' },
            { name: 'Diwali greeting draft', when: '1 hafte pehle', icon: '🪔' },
          ].map(e => (
            <div key={e.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-surface transition-colors cursor-pointer"
              onClick={() => { setForm(f => ({ ...f, name: e.name })); setShowForm(true) }}>
              <span className="text-lg">{e.icon}</span>
              <div>
                <p className="text-text-primary text-sm font-display font-500">{e.name}</p>
                <p className="text-text-muted text-xs">{e.when}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardShell>
  )
}
