'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Mic, CheckSquare, Users, ShieldCheck,
  TrendingUp, Sparkles, Target, Zap
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
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
        <p className="text-zinc-500 font-medium mt-1">
          {user?.business_name} • System is active and monitoring
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'AI Actions Processed', value: totalActions, icon: CheckSquare, sub: 'Operations completed' },
            { label: 'Hours of Work Saved', value: Math.round(Number(totalActions) * 0.25) || 0, icon: Sparkles, sub: 'Assumes 15m per task' },
            { label: 'CRM Leads Extracted', value: stats?.clients || 0, icon: Users, sub: 'Auto-captured from voice' },
            { label: 'Pending Commitments', value: commitments.filter(c => c.status !== 'completed').length || 0, icon: Target, sub: 'Actively tracking' },
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
                <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight">AI Action Distribution</h2>
              </div>
              <div className="h-64">
                {intentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        cursor={{ fill: '#f4f4f5' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
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
                    <p className="text-sm font-medium">No actions processed yet</p>
                  </div>
                )}
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

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={itemFramer} className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm h-full">
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

          <motion.div variants={itemFramer}>
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm h-full flex flex-col items-center justify-center text-center">
              <h2 className="font-display font-800 text-xl text-zinc-900 tracking-tight w-full text-left mb-6">Task Capacity</h2>
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
                    {Math.round(((user?.tasks_used || 0) / (user?.tasks_limit || 50)) * 100)}%
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
