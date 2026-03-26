'use client'
import { useEffect, useState } from 'react'
import { Target, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'

export default function CommitmentsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [commitments, setCommitments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.dashboard.me(), api.dashboard.commitments()])
      .then(([u, c]) => { setUser(u); setCommitments(c as any[]); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Active Promises</h1>
        <p className="text-zinc-500 font-medium text-base">
          Promises made to your clients via voice. Tracked proactively by our backend.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="space-y-4 max-w-4xl">
        {commitments.length === 0 && (
          <div className="text-center py-24 px-4 bg-zinc-50 border border-zinc-200 rounded-[2rem]">
            <Target className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-600 font-bold text-base">No active commitments executing.</p>
            <p className="text-zinc-400 font-medium text-sm mt-1">Send Vaani a voice note with a deadline context (e.g. "Remind me to call him at 4PM").</p>
          </div>
        )}
        {commitments.map(c => (
          <motion.div variants={itemFramer} key={c.id}>
            <Card className="flex items-center gap-5 hover:border-zinc-300 bg-white border-zinc-200 shadow-sm p-5 rounded-2xl transition-all cursor-pointer group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                c.status === 'completed' ? 'bg-zinc-100 text-green-500 border-zinc-200' : 
                c.status === 'missed' ? 'bg-red-50 text-red-500 border-red-100' : 
                'bg-brand/10 text-brand border-brand/20'
              }`}>
                {c.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                 c.status === 'missed' ? <Clock className="w-5 h-5" /> : 
                 <Target className="w-5 h-5" />}
              </div>
              
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1.5">
                  <p className="font-display font-800 text-zinc-900 text-lg tracking-tight break-words whitespace-normal leading-tight">{c.desc}</p>
                  <span className="w-fit text-[9px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">{c.type}</span>
                </div>
                <p className="text-zinc-500 font-medium text-sm break-words whitespace-normal leading-relaxed">Target Recipient: <span className="text-zinc-900 font-bold">{c.recipient}</span></p>

              <div className="text-right flex-shrink-0 flex flex-col items-end">
                <Badge color={
                  c.status === 'completed' ? 'success' : 
                  c.status === 'missed' ? 'danger' : 'warning'
                } className="mb-2 uppercase tracking-widest text-[9px] font-bold px-2 py-1">
                  {c.status === 'missed' ? 'Breached' : c.status}
                </Badge>
                <p className="text-zinc-400 text-xs font-mono font-bold bg-zinc-50 px-2 py-1 border border-zinc-100 rounded-md">
                  {new Date(c.due).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
