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
      .then(([u, c]) => { setUser(u); setCommitments(c); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-6">
        <h1 className="font-display font-800 text-2xl text-text-primary mb-1 tracking-tight">Active Commitments</h1>
        <p className="text-text-secondary text-sm">
          Everything you promised via Voice. Tracked dynamically by Celery.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="space-y-4">
        {commitments.length === 0 && (
          <div className="text-center py-20 px-4 bg-bg-surface border border-bg-border rounded-2xl">
            <Target className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-text-muted text-sm font-500">No active commitments found.</p>
            <p className="text-text-muted text-xs mt-1">Send Vaani a voice note with a deadline.</p>
          </div>
        )}
        {commitments.map(c => (
          <motion.div variants={itemFramer} key={c.id}>
            <Card className="flex items-center gap-4 hover:border-brand/30 transition-colors cursor-pointer group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                c.status === 'completed' ? 'bg-success/10 text-success' : 
                c.status === 'missed' ? 'bg-danger/10 text-danger' : 
                'bg-brand/10 text-brand'
              }`}>
                {c.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                 c.status === 'missed' ? <Clock className="w-5 h-5" /> : 
                 <Target className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-700 text-text-primary text-sm truncate">{c.desc}</p>
                  <span className="text-[10px] uppercase tracking-wider font-700 text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full border border-bg-border">{c.type}</span>
                </div>
                <p className="text-text-secondary text-xs truncate">To: {c.recipient}</p>
              </div>

              <div className="text-right flex-shrink-0 flex flex-col items-end">
                <Badge color={
                  c.status === 'completed' ? 'success' : 
                  c.status === 'missed' ? 'danger' : 'warning'
                } className="mb-1 uppercase tracking-wider text-[10px]">
                  {c.status}
                </Badge>
                <p className="text-text-muted text-[11px] font-mono">
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
