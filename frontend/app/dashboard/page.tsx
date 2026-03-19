'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mic, FileText, CheckSquare, Users, AlertCircle,
  IndianRupee, Zap, TrendingUp, MessageCircle,
  Clock, ChevronRight, ExternalLink, Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, StatCard, Badge, Spinner, Button, ProgressBar } from '@/components/ui'

const INTENT_LABELS: Record<string, { label: string; color: 'brand'|'teal'|'success'|'warning'|'muted' }> = {
  save_note:        { label: 'Note saved',      color: 'brand' },
  create_task:      { label: 'Task created',    color: 'teal' },
  log_meeting:      { label: 'Meeting logged',  color: 'success' },
  update_crm:       { label: 'CRM updated',     color: 'warning' },
  generate_invoice: { label: 'Invoice created', color: 'brand' },
  log_expense:      { label: 'Expense logged',  color: 'muted' },
  draft_email:      { label: 'Email drafted',   color: 'teal' },
  compliance_query: { label: 'Compliance Q',    color: 'warning' },
}

export default function DashboardPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [user,       setUser]       = useState<any>(null)
  const [stats,      setStats]      = useState<any>(null)
  const [compliance, setCompliance] = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const welcome = params.get('welcome') === '1'

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s, c] = await Promise.all([
          api.dashboard.me(), api.dashboard.stats(), api.dashboard.compliance()
        ])
        setUser(u); setStats(s); setCompliance(c)
      } catch { router.push('/auth/login') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
    </DashboardShell>
  )

  const urgentCompliance = compliance.filter(c => c.days_until <= 7).slice(0, 3)

  return (
    <DashboardShell user={user}>
      {/* Welcome banner */}
      {welcome && (
        <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">
              Swagat hai, {user?.name?.split(' ')[0]}! 🎉 Vaani mein aapka 7-day free trial shuru ho gaya.
            </p>
            <p className="text-text-secondary text-sm">
              Pehle Notion connect karo phir WhatsApp pe "Hello Vaani" bhejo — magic dekhein.
            </p>
            <div className="flex gap-3 mt-3">
              <Button size="sm" onClick={() => router.push('/dashboard/integrations')}>
                Notion connect karo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/billing')}>
                Plan dekhein
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-text-primary">
          Namaste, {user?.name?.split(' ')[0] || 'User'} 🙏
        </h1>
        <p className="text-text-secondary text-sm mt-1">{user?.business_name} • {user?.plan?.toUpperCase()} plan</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Messages (30d)" value={stats?.messages_30d || 0}
          icon={MessageCircle} sub="via WhatsApp & Telegram" />
        <StatCard label="Tasks used" value={`${user?.tasks_used || 0}/${user?.tasks_limit === 999999 ? '∞' : user?.tasks_limit}`}
          icon={CheckSquare} sub={`${user?.plan} plan`} />
        <StatCard label="Clients" value={stats?.clients || 0}
          icon={Users} sub="in your CRM" />
        <StatCard label="Expenses (30d)" value={`₹${(stats?.expense_30d_inr || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee} sub="logged this month" />
      </div>

      {/* Usage bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-600 text-text-primary text-sm">Monthly usage</p>
          <span className="text-text-muted text-xs">{user?.tasks_used} of {user?.tasks_limit === 999999 ? 'unlimited' : user?.tasks_limit} tasks</span>
        </div>
        <ProgressBar value={user?.tasks_used || 0} max={user?.tasks_limit || 50} />
        {(user?.tasks_used / user?.tasks_limit) > 0.8 && (
          <p className="text-warning text-xs mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            80% usage reached.{' '}
            <span className="text-brand-light cursor-pointer" onClick={() => router.push('/dashboard/billing')}>Upgrade karo →</span>
          </p>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-text-primary">Recent activity</h2>
            <TrendingUp className="w-4 h-4 text-text-muted" />
          </div>
          <div className="space-y-2">
            {stats?.recent_tasks?.length > 0 ? stats.recent_tasks.map((t: any) => {
              const meta = INTENT_LABELS[t.intent] || { label: t.intent, color: 'muted' as const }
              return (
                <div key={t.id} className="flex items-start gap-3 py-2 border-b border-bg-border last:border-0">
                  <Badge color={meta.color} className="flex-shrink-0 mt-0.5">{meta.label}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-xs truncate">{t.summary || 'Processing...'}</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {new Date(t.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {t.notion_url && (
                    <a href={t.notion_url} target="_blank" rel="noopener" className="text-text-muted hover:text-brand transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )
            }) : (
              <div className="text-center py-8">
                <Mic className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm">Koi activity nahi abhi tak.</p>
                <p className="text-text-muted text-xs mt-1">WhatsApp pe Vaani ko message bhejo!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Compliance alerts */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-600 text-text-primary">Upcoming compliance</h2>
            <button onClick={() => router.push('/dashboard/compliance')}
              className="text-brand-light text-xs font-display flex items-center gap-1 hover:gap-2 transition-all">
              Sab dekhein <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {urgentCompliance.length > 0 ? urgentCompliance.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-bg-border last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  c.is_overdue ? 'bg-danger' : c.days_until <= 1 ? 'bg-danger animate-pulse' : c.days_until <= 3 ? 'bg-warning' : 'bg-success'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-display font-500 truncate">{c.description}</p>
                  <p className="text-text-muted text-xs">{c.period}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-display font-600 ${c.is_overdue ? 'text-danger' : c.days_until <= 3 ? 'text-warning' : 'text-text-muted'}`}>
                    {c.is_overdue ? 'Overdue!' : c.days_until === 0 ? 'Aaj!' : `${c.days_until}d left`}
                  </p>
                  <p className="text-text-muted text-xs">{new Date(c.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm">Next 7 din mein koi deadline nahi.</p>
                <p className="text-success text-xs mt-1">✓ Aap clear hain!</p>
              </div>
            )}
          </div>
          {urgentCompliance.length > 0 && (
            <div className="mt-3 pt-3 border-t border-bg-border">
              <p className="text-text-muted text-xs">
                Vaani automatically WhatsApp reminders bhejta hai 3 din, 1 din, aur din par.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick start guide */}
      {!user?.connected_integrations?.includes('notion') && (
        <Card className="mt-6 bg-bg-elevated">
          <h2 className="font-display font-600 text-text-primary mb-4">Shuru karne ke 3 steps</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: 1, title: 'Notion connect karo', desc: 'Apna Vaani Second Brain ek click mein setup ho jaata hai.', action: 'Connect karo', href: '/dashboard/integrations' },
              { step: 2, title: 'WhatsApp pe "Hello" bhejo', desc: `+91 XXXXX ko save karo aur pehla message bhejo.`, action: 'WhatsApp kholo', href: 'https://wa.me/' },
              { step: 3, title: 'Voice note try karo', desc: '2 min ka voice note bhejo — Notion mein structured note dekhein.', action: null, href: null },
            ].map(({ step, title, desc, action, href }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand/15 flex items-center justify-center flex-shrink-0 text-brand font-display font-700 text-sm">{step}</div>
                <div>
                  <p className="font-display font-600 text-text-primary text-sm mb-1">{title}</p>
                  <p className="text-text-muted text-xs mb-2">{desc}</p>
                  {action && href && (
                    <button onClick={() => href.startsWith('/') ? router.push(href) : window.open(href, '_blank')}
                      className="text-brand-light text-xs font-display font-600 hover:underline flex items-center gap-1">
                      {action} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardShell>
  )
}
