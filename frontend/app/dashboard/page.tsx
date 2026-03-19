'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mic, CheckSquare, Users, ShieldCheck,
  TrendingUp, MessageCircle, ArrowRight,
  Sparkles, Target, Zap
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, StatCard, Badge, Spinner, Button, ProgressBar } from '@/components/ui'

const INTENT_LABELS: Record<string, { label: string; color: 'brand'|'teal'|'success'|'warning'|'muted' }> = {
  save_note:        { label: 'Note / Idea Dump', color: 'brand' },
  commitment_capture:{ label: 'Commitment Logged',color: 'warning' },
  lead_capture:     { label: 'Lead Sniper CRM', color: 'success' },
  habit_log:        { label: 'Habit Logged',    color: 'teal' },
  create_task:      { label: 'Task created',    color: 'teal' },
  log_meeting:      { label: 'Meeting logged',  color: 'success' },
  update_crm:       { label: 'CRM updated',     color: 'warning' },
  generate_invoice: { label: 'Invoice created', color: 'brand' },
}

export default function DashboardPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [user,       setUser]       = useState<any>(null)
  const [stats,      setStats]      = useState<any>(null)
  const [commitments,setCommitments]= useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const welcome = params.get('welcome') === '1'

  useEffect(() => {
    const load = async () => {
      try {
        const [u, s, c] = await Promise.all([
          api.dashboard.me(), api.dashboard.stats(), api.dashboard.commitments()
        ])
        setUser(u); setStats(s); setCommitments((c as any[]).slice(0, 5));
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

  const cashflowData = [
    { name: 'Mon', in: 12000, out: 4000 },
    { name: 'Tue', in: 19000, out: 8000 },
    { name: 'Wed', in: 15000, out: 6000 },
    { name: 'Thu', in: 8000,  out: 12000 },
    { name: 'Fri', in: 22000, out: 5000 },
    { name: 'Sat', in: 3000,  out: 2000 },
    { name: 'Sun', in: 5000,  out: 1000 },
  ]

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.1 } }
  }

  return (
    <DashboardShell user={user}>
      {/* Welcome banner */}
      {welcome && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-brand/10 border border-brand/20 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-600 text-text-primary mb-1">
              Active Agent Initialized, {user?.name?.split(' ')[0]}! ⚡ Let's hijack your workflows.
            </p>
            <p className="text-text-secondary text-sm mb-3">
              Wire up the Second Brain to begin auto-structuring Ideas and capturing Lead Snipers.
            </p>
            <div className="flex gap-3">
              <Button size="sm" onClick={() => router.push('/dashboard/integrations')}>Configure Agent Chains</Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-8">
        <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight">
          Command Center
        </h1>
        <p className="text-text-secondary text-sm mt-1">{user?.business_name} • Active Quotas: {user?.plan?.toUpperCase()}</p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div variants={itemFramer}>
            <StatCard label="Client Reliability Score" value="94/100" icon={ShieldCheck} sub="Commitments Met" />
          </motion.div>
          <motion.div variants={itemFramer}>
            <StatCard label="Active Observer" value="Celery" icon={Zap} sub="Gmail + WA Hook" />
          </motion.div>
          <motion.div variants={itemFramer}>
            <StatCard label="Flash-Lite Tokens" value="1.2M" icon={CheckSquare} sub="Used this month" />
          </motion.div>
          <motion.div variants={itemFramer}>
            <StatCard label="CRM Injections" value={stats?.clients || 15} icon={Users} sub="Leads Snipped" />
          </motion.div>
        </div>

        {/* Heatmap & Commitments Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={itemFramer} className="lg:col-span-2">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-700 text-text-primary">Cash Flow Heatmap (Debts vs Credits)</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData}>
                    <XAxis dataKey="name" stroke="#545670" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#545670" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111326', border: '1px solid #1E2240', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                    <Area type="monotone" dataKey="in" stroke="#00CCA3" strokeWidth={3} fill="url(#colorIn)" fillOpacity={0.2} name="Credits (In)" />
                    <Area type="monotone" dataKey="out" stroke="#EF4444" strokeWidth={3} fill="url(#colorOut)" fillOpacity={0.15} name="Debts (Out)" />
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00CCA3" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00CCA3" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemFramer} className="h-full">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-700 text-text-primary flex items-center gap-2">
                  <Target className="w-5 h-5 text-warning" /> Active Commitments
                </h2>
              </div>
              <div className="space-y-4">
                {commitments.length === 0 && (
                  <p className="text-sm text-text-muted mt-2">No active commitments found.</p>
                )}
                {commitments.map((c) => (
                  <div key={c.id} className="pb-3 border-b border-bg-border last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-600 text-sm truncate">{c.desc}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-600 tracking-wide uppercase ${c.status === 'completed' ? 'bg-success/10 text-success' : 'bg-brand/10 text-brand-light'}`}>{c.status}</span>
                      <span className="text-[10px] text-text-muted">For: {c.recipient}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-bg-border">
                <p className="text-text-muted text-xs leading-relaxed">
                  Vaani tracks commitments using dateparser and pings you dynamically to fulfill them via Celery Observers.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemFramer} className="mb-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" /> Agent Activity Log
              </h2>
            </div>
            <div className="space-y-2">
              {stats?.recent_tasks?.length > 0 ? stats.recent_tasks.map((t: any) => {
                const meta = INTENT_LABELS[t.intent] || { label: t.intent, color: 'muted' as const }
                return (
                  <div key={t.id} className="flex items-start gap-4 py-3 border-b border-bg-border/60 hover:bg-bg-elevated/50 px-3 rounded-xl transition-colors last:border-0 cursor-pointer">
                    <Badge color={meta.color} className="flex-shrink-0 mt-0.5 w-32 justify-center">{meta.label}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-500 truncate">{t.summary || 'Processing...'}</p>
                      <p className="text-text-muted text-[11px] font-mono mt-1">
                        Flash-Lite processed • {new Date(t.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-center py-10">
                  <Mic className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-text-muted text-sm font-500">No agentic interactions logged yet.</p>
                  <p className="text-text-muted text-xs mt-1">Ping Vaani on WhatsApp to see the router in action.</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </DashboardShell>
  )
}
