'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mic, CheckSquare, Users, ShieldCheck,
  TrendingUp, Sparkles, Target, Zap, Send
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import OnboardingTutorial from '@/components/dashboard/OnboardingTutorial'

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  save_note:        { label: 'Note / idea dump', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
  commitment_capture:{ label: 'Commitment',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
  lead_capture:     { label: 'Lead capture',     color: 'bg-green-50 text-green-700 border-green-200' },
  habit_log:        { label: 'Habit logged',    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  create_task:      { label: 'Task created',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
  log_meeting:      { label: 'Meeting',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
  update_crm:       { label: 'Crm updated',     color: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
  generate_invoice: { label: 'Invoice created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

import { Plug } from 'lucide-react'

import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardShell><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" /></div></DashboardShell>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
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
      } catch {
        // Enforce strict production authentication; no dummy loops.
        router.push('/auth/login')
      }
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

  const intentData = stats?.tasks_by_intent 
    ? Object.entries(stats.tasks_by_intent).map(([k, v]) => ({ 
        name: INTENT_LABELS[k]?.label || k.replace('_', ' '), 
        count: v 
      }))
    : []

  const totalActions = stats?.tasks_by_intent 
    ? Object.values(stats.tasks_by_intent).reduce((a: any, b: any) => a + b, 0) 
    : 0

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
      <OnboardingTutorial />
      {/* Welcome banner (Solid Premium) */}
      {welcome && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-zinc-200 rounded-[2rem] p-7 mb-10 flex items-start gap-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-800 text-xl text-zinc-900 mb-1.5 tracking-tight">
              Active Agent Initialized, {user?.name?.split(' ')[0]}! ⚡
            </h2>
            <p className="text-zinc-500 font-display font-600 text-sm mb-5 leading-relaxed">
              Connect your Notion database to begin auto-structuring Ideas and capturing Lead contact cards. We'll handle the logistics while you focus on execution.
            </p>
            <button onClick={() => router.push('/dashboard/integrations')} className="bg-zinc-900 text-white font-display font-700 text-xs uppercase tracking-widest px-8 py-3 rounded-full hover:bg-zinc-800 transition-all shadow-sm active:scale-95">
              Connect Integrations
            </button>
          </div>
        </motion.div>
      )}

      <div className="mb-8 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-800 text-zinc-900 tracking-tight">Command center</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            {user?.business_name} • System Monitoring Active
          </p>
        </div>
        <div className="hidden lg:block">
          <a href="https://t.me/Chaitanya_VaaniBot" target="_blank" rel="noopener"
            className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 shadow-sm rounded-full px-6 py-2.5 hover:shadow-md">
            <Send className="w-4 h-4 text-zinc-900" />
            Open Telegram Bot
          </a>
        </div>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show">
        {/* Stats grid (True Square 1:1 with 12px gap) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'AI Actions', value: totalActions, icon: CheckSquare, sub: 'Processed' },
          { label: 'Hours Saved', value: Math.round(Number(totalActions) * 0.25) || 0, icon: Sparkles, sub: 'Efficiency' },
          { label: 'CRM Leads', value: stats?.clients || 0, icon: Users, sub: 'Captured' },
          { label: 'Pending', value: commitments.filter(c => c.status !== 'completed').length || 0, icon: Target, sub: 'Tracking' },
        ].map((stat, i) => (
          <motion.div variants={itemFramer} key={i}>
            <div className="native-card p-3.5 lg:p-5 aspect-square flex flex-col justify-between hover:border-zinc-300 animate-native-fast cursor-pointer group active:scale-[0.97]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-4 h-4 text-zinc-900" />
                </div>
                <span className="text-[11px] lg:text-xs font-semibold text-zinc-400">
                  {stat.label}
                </span>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-800 text-zinc-900 tracking-tighter">{stat.value}</div>
                <div className="text-[10px] lg:text-body-secondary font-semibold text-zinc-400 mt-1 sm:block hidden tracking-widest lowercase first-letter:uppercase">
                  {stat.sub}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Heatmap & Commitments Grid (16px Card Radius / Title 2) */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <motion.div variants={itemFramer} className="lg:col-span-2">
          <div className="native-card p-6 shadow-sm h-auto max-w-full overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-800 text-zinc-900 tracking-tight">Action distribution</h2>
            </div>
              <div className="h-64">
                {intentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} hide={typeof window !== 'undefined' && window.innerWidth < 450} />
                      <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: '#f4f4f5' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#18181b', fontWeight: 'bold' }} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#18181b" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-body-secondary">No actions processed yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        <motion.div variants={itemFramer} className="h-auto">
          <div className="native-card p-6 shadow-sm h-auto flex flex-col max-w-full overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-800 text-zinc-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" /> Commitments
              </h2>
            </div>
              <div className="space-y-4 flex-1">
                {commitments.length === 0 && (
                  <p className="text-body-secondary mt-2">No active commitments found.</p>
                )}
                {commitments.map((c) => (
                  <div key={c.id} className="pb-4 border-b border-zinc-50 last:border-0 last:pb-0">
                    <p className="text-[15px] font-700 text-zinc-900 mb-2">{c.desc}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-caption-native px-2 py-0.5 rounded-md ${c.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                        {c.status}
                      </span>
                      <span className="text-body-secondary text-[13px]">For: {c.recipient}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <motion.div variants={itemFramer} className="lg:col-span-2">
          <div className="native-card p-5 sm:p-8 shadow-sm h-auto max-w-full overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-800 text-zinc-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-zinc-900" /> Action log
              </h2>
            </div>
              <div className="space-y-2">
                {stats?.recent_tasks?.length > 0 ? stats.recent_tasks.map((t: any) => {
                  const meta = INTENT_LABELS[t.intent] || { label: t.intent, color: 'bg-zinc-100 text-zinc-800 border-zinc-200' }
                  return (
                    <div key={t.id} className="flex items-center gap-3 sm:gap-5 py-2.5 sm:py-3 border-b border-zinc-50 hover:bg-zinc-50 px-2 sm:px-4 rounded-xl sm:rounded-2xl transition-colors last:border-0 cursor-pointer active:scale-[0.99] overflow-hidden">
                      <div className={`flex-shrink-0 text-[10px] sm:text-[11px] font-bold tracking-tight px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border ${meta.color} w-24 sm:w-36 truncate text-center shadow-sm`}>
                        {meta.label}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <p className="text-zinc-900 text-[13px] sm:text-[15px] font-bold truncate pr-1 sm:pr-4">{t.summary || 'Operation logged'}</p>
                        <p className="text-zinc-400 text-[9px] sm:text-[11px] font-800 whitespace-nowrap hidden sm:block">
                          {new Date(t.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-10">
                    <Mic className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                    <p className="text-zinc-900 text-sm font-bold">No operations yet.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        <motion.div variants={itemFramer}>
          <div className="native-card p-8 shadow-sm h-auto flex flex-col items-center justify-start text-center max-w-full overflow-visible">
            <div className="w-full mb-10">
              <h2 className="text-xl font-display font-800 text-zinc-900 tracking-tight text-left">Task capacity</h2>
            </div>
              <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Used', value: user?.tasks_used || 0, color: '#18181b' },
                        { name: 'Available', value: Math.max(0, (user?.tasks_limit || 50) - (user?.tasks_used || 0)), color: '#f4f4f5' }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {[{ color: '#18181b' }, { color: '#f4f4f5' }].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                  <span className="text-3xl font-display font-900 text-zinc-900">
                    {user?.tasks_limit === 999999 ? '∞' : `${Math.round(((user?.tasks_used || 0) / (user?.tasks_limit || 50)) * 100)}%`}
                  </span>
                </div>
              </div>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mt-4">
                {user?.tasks_used} / {user?.tasks_limit === 999999 ? '∞' : user?.tasks_limit} tasks consumed
              </p>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </DashboardShell>
  )
}
