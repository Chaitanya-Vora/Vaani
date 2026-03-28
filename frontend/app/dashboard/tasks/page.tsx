'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'
import { PremiumEmptyState } from '@/components/ui/EmptyState'

export default function TasksPage() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.dashboard.me(),
      (api.dashboard as any).tasks ? (api.dashboard as any).tasks() : Promise.resolve([]) // Fallback if API client isn't updated yet
    ])
      .then(([u, t]) => { setUser(u); setTasks(t); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-8 px-1">
        <h1 className="text-title-1 text-zinc-900 mb-1">Priority Tasks</h1>
        <p className="text-body-secondary mt-1">
          Your active execution queue. Vaani will ping you when deadlines approach.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="max-w-3xl space-y-3">
        {tasks.length === 0 && (
          <PremiumEmptyState
            icon={CheckCircle2}
            title="You're all caught up!"
            description="Your execution queue is clear. Send a voice note like 'Remind me to call Rahul' to add a task."
            actionLabel="View History"
            onAction={() => console.log('History')}
            centered
          />
        )}
        
        {tasks.map(t => (
          <motion.div variants={itemFramer} key={t.id}>
            <div className="native-card flex items-center gap-4 transition-all cursor-pointer group p-5 active:scale-[0.98] animate-native-fast">
              <div className="flex-shrink-0">
                {t.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-zinc-300" />
                ) : (
                  <Circle className={`w-6 h-6 ${t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-zinc-900' : 'text-zinc-300'}`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-body-native font-500 break-words whitespace-normal transition-all duration-200 ${t.status === 'completed' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                  {t.description}
                </p>
                {t.due_date && (
                  <div className="flex items-center gap-1.5 mt-2 text-body-secondary font-500">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>Due: {new Date(t.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                 <span className={`text-caption-native px-2 py-0.5 rounded-md border ${
                   t.status === 'completed' ? 'bg-zinc-50 text-zinc-400 border-zinc-100' :
                   t.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                   t.priority === 'medium' ? 'bg-zinc-900 text-white border-zinc-900' : 
                   'bg-zinc-100 text-zinc-500 border-zinc-200'
                 }`}>
                   {t.priority}
                 </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
