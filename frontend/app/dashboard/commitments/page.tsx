'use client'
import { useEffect, useState } from 'react'
import { Target, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'
import { PremiumEmptyState } from '@/components/ui/EmptyState'

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
      <div className="mb-8 px-1">
        <h1 className="text-title-1 text-zinc-900 mb-1">Commitments</h1>
        <p className="text-body-secondary mt-1">
          Promises made to your clients via voice. Tracked proactively by our backend.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="space-y-3 max-w-4xl">
        {commitments.length === 0 && (
          <PremiumEmptyState
            icon={Target}
            title="No active commitments"
            description="Your promise queue is clear. Send Vaani a voice note like 'Remind me to call him at 4PM' to track a new commitment."
            actionLabel="View Breaches (Coming Soon)"
            onAction={() => console.log('Breaches')}
            centered
          />
        )}
        {commitments.map(c => (
          <motion.div variants={itemFramer} key={c.id}>
            <div className="native-card flex items-center gap-4 p-5 transition-all cursor-pointer group active:scale-[0.98] animate-native-fast">
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 border shadow-sm ${
                c.status === 'completed' ? 'bg-zinc-50 text-green-500 border-zinc-100' : 
                c.status === 'missed' ? 'bg-red-50 text-red-500 border-red-100' : 
                'bg-zinc-900 text-white border-zinc-900'
              }`}>
                {c.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : 
                 c.status === 'missed' ? <Clock className="w-5 h-5" /> : 
                 <Target className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                  <p className="text-body-native font-700 text-zinc-900 tracking-tight break-words whitespace-normal leading-tight">{c.desc}</p>
                  <span className="w-fit text-caption-native text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">{c.type}</span>
                </div>
                <p className="text-body-secondary font-500">Recipient: <span className="text-zinc-900 font-700">{c.recipient}</span></p>
              </div>

              <div className="text-right flex-shrink-0 flex flex-col items-end">
                <Badge color={
                  c.status === 'completed' ? 'success' : 
                  c.status === 'missed' ? 'danger' : 'warning'
                } className="mb-2 text-caption-native px-2 py-0.5">
                  {c.status === 'missed' ? 'Breached' : c.status}
                </Badge>
                <div className="text-body-secondary text-[11px] font-700 bg-zinc-50 px-2 py-1 border border-zinc-100 rounded-lg">
                  {new Date(c.due).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
