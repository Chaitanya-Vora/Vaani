'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'

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
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Priority Tasks</h1>
        <p className="text-zinc-500 text-base font-medium">
          Your active execution queue. Vaani will ping you when deadlines approach.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="max-w-3xl space-y-3">
        {tasks.length === 0 && (
          <div className="text-center py-24 px-4 bg-zinc-50 border border-zinc-200 rounded-[2rem]">
            <CheckCircle2 className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-base font-semibold">You're all caught up!</p>
            <p className="text-zinc-400 text-sm mt-1">Send a voice note like "I need to call Rahul today" to add a task.</p>
          </div>
        )}
        
        {tasks.map(t => (
          <motion.div variants={itemFramer} key={t.id}>
            <Card className="flex items-center gap-4 hover:border-zinc-300 transition-colors cursor-pointer group p-4 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex-shrink-0">
                {t.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-zinc-300" />
                ) : (
                  <Circle className={`w-6 h-6 ${t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-orange-400' : 'text-zinc-300'}`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium sm:text-lg truncate ${t.status === 'completed' ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                  {t.description}
                </p>
                {t.due_date && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {new Date(t.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                 <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${
                   t.priority === 'high' ? 'bg-red-50 text-red-600' : 
                   t.priority === 'medium' ? 'bg-orange-50 text-orange-600' : 
                   'bg-zinc-100 text-zinc-500'
                 }`}>
                   {t.priority}
                 </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
