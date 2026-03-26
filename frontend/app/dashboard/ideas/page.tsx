'use client'
import { useEffect, useState } from 'react'
import { Lightbulb, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Spinner } from '@/components/ui'

export default function IdeasPage() {
  const [user, setUser] = useState<any>(null)
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.dashboard.me(),
      (api.dashboard as any).ideas ? (api.dashboard as any).ideas() : Promise.resolve([]) // Fallback if API client isn't updated yet
    ])
      .then(([u, i]) => { setUser(u); setIdeas(i); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Idea Vault</h1>
        <p className="text-zinc-500 text-base font-medium">
          Your shower thoughts and startup concepts, instantly saved via WhatsApp.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ideas.length === 0 && (
          <div className="col-span-full text-center py-24 px-4 bg-zinc-50 border border-zinc-200 rounded-[2rem]">
            <Lightbulb className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-base font-semibold">Your vault is empty.</p>
            <p className="text-zinc-400 text-sm mt-1">Send Vaani a voice note starting with &quot;Idea:&quot; to see it appear here.</p>
          </div>
        )}
        
        {ideas.map(i => (
          <motion.div variants={itemFramer} key={i.id} className="h-full">
            <Card className="flex flex-col h-full hover:border-zinc-300 transition-colors cursor-pointer group p-6 rounded-[1.5rem] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">{i.category || 'General'}</span>
                {i.notion_url && (
                   <a href={i.notion_url} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-900 transition-colors">
                     <ExternalLink className="w-4 h-4" />
                   </a>
                )}
              </div>
              <p className="font-medium text-zinc-700 text-sm leading-relaxed flex-1">
                {i.content}
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span>{new Date(i.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <Lightbulb className="w-3.5 h-3.5 opacity-50" />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
