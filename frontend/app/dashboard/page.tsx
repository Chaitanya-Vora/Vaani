'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mic, CheckSquare, Users, ShieldCheck,
  TrendingUp, Sparkles, Target, Zap
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  save_note:        { label: 'Note / Idea Dump', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
  commitment_capture:{ label: 'Commitment',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
  lead_capture:     { label: 'Lead Capture',     color: 'bg-green-50 text-green-700 border-green-200' },
  habit_log:        { label: 'Habit Logged',    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  create_task:      { label: 'Task created',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  log_meeting:      { label: 'Meeting',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  update_crm:       { label: 'CRM updated',     color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  generate_invoice: { label: 'Invoice created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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
  }, [router])

  if (loading) return (
    <DashboardShell>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 border border-zinc-200 rounded-[1.5rem] p-6 mb-8 flex items-start gap-4 shadow-sm">
          <Sparkles className="w-6 h-6 text-zinc-900 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-bold text-lg text-zinc-900 mb-1">
              Active Agent Initialized, {user?.name?.split(' ')[0]}! ⚡ Let's organize your workflows.
            </p>
            <p className="text-zinc-500 font-medium mb-4">
              Connect your Notion database to begin auto-structuring Ideas and capturing Lead contact cards.
            </p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/dashboard/integrations')} className="bg-zinc-900 text-white font-semibold px-5 py-2 rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
                Connect Integrations
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-10">
        <h1 className="font-display font-800 text-3xl text-zinc-900 tracking-tight">
          Command Center
        </h1>
        <p className="text-zinc-500 font-medium mt-1">{user?.business_name} • Active Configuration: {user?.plan?.toUpperCase()}</p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Client Reliability Score', value: '94/100', icon: ShieldCheck, sub: 'Commitments Met' },
            { label: 'Active Observer', value: 'Celery', icon: Zap, sub: 'Always Listening' },
            { label: 'AI Actions Processed', value: '1,204', icon: CheckSquare, sub: 'Used this month' },
            { label: 'CRM Leads Extracted', value: stats?.clients || 15, icon: Users, sub: 'Via Business Cards' },
          ].map((stat, i) => (
            <motion.div variants={itemFramer} key={i}>
              <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                    <stat.icon className="w-4 h-4 text-zinc-700" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-2xl font-display font-800 text-zinc-900 tracking-tight">{stat.value}</div>
                <div className="text-xs text-zinc-400 font-medium mt-1">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Heatmap & Commitments Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={itemFramer} className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight">Financial Overview</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowData}>
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#18181b', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} fill="url(#colorIn)" fillOpacity={0.2} name="Credits (In)" />
                    <Area type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={3} fill="url(#colorOut)" fillOpacity={0.15} name="Debts (Out)" />
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemFramer} className="h-full">
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-800 text-xl text-zinc-900 flex items-center gap-2 tracking-tight">
                  <Target className="w-5 h-5 text-orange-500" /> Commitments Tracker
                </h2>
              </div>
              <div className="space-y-4 flex-1">
                {commitments.length === 0 && (
                  <p className="text-sm font-medium text-zinc-500 mt-2">No active commitments found.</p>
                )}
                {commitments.map((c) => (
                  <div key={c.id} className="pb-4 border-b border-zinc-100 last:border-0 last:pb-0">
                    <p className="font-bold text-zinc-900 text-[15px] mb-2">{c.desc}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wide uppercase ${c.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {c.status}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">For: {c.recipient}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100">
                <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                  Vaani tracks commitments using NLP and pings you dynamically on WhatsApp to fulfill them.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemFramer} className="mb-6">
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-800 text-xl text-zinc-900 flex items-center gap-2 tracking-tight">
                <TrendingUp className="w-5 h-5 text-zinc-900" /> Operational Action Log
              </h2>
            </div>
            <div className="space-y-3">
              {stats?.recent_tasks?.length > 0 ? stats.recent_tasks.map((t: any) => {
                const meta = INTENT_LABELS[t.intent] || { label: t.intent, color: 'bg-zinc-100 text-zinc-800 border-zinc-200' }
                return (
                  <div key={t.id} className="flex items-center gap-5 py-3 border-b border-zinc-50 hover:bg-zinc-50 px-4 rounded-2xl transition-colors last:border-0 cursor-pointer">
                    <div className={`flex-shrink-0 text-[11px] font-bold tracking-wide uppercase px-3 py-1.5 rounded-lg border ${meta.color} w-36 text-center shadow-sm`}>
                      {meta.label}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <p className="text-zinc-900 text-[15px] font-semibold truncate pr-4">{t.summary || 'Processing operation...'}</p>
                      <p className="text-zinc-400 text-[11px] font-bold whitespace-nowrap hidden sm:block">
                        {new Date(t.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-900 text-base font-bold">No operations processed yet.</p>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Send a voice note or image to Vaani on WhatsApp to see it appear here.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </motion.div>
    </DashboardShell>
  )
}
