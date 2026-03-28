'use client'
import { useEffect, useState } from 'react'
import { Lightbulb, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Spinner } from '@/components/ui'
import { PremiumEmptyState } from '@/components/ui/EmptyState'

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
      <div className="mb-8 px-1">
        <h1 className="text-title-1 text-zinc-900 mb-1">Idea Vault</h1>
        <p className="text-body-secondary mt-1">
          Your shower thoughts and startup concepts, instantly saved via WhatsApp.
        </p>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ideas.length === 0 && (
          <div className="col-span-full">
            <PremiumEmptyState
              icon={Lightbulb}
              title="Your Idea Vault is empty"
              description="Send Vaani a voice note starting with 'Idea:' to see your concepts appear here instantly."
              actionLabel="Explore Templates"
              onAction={() => console.log('Templates')}
            />
          </div>
        )}
        
        {ideas.map(i => (
          <motion.div variants={itemFramer} key={i.id} className="h-full">
            <div className="native-card flex flex-col h-full active:scale-[0.98] transition-all cursor-pointer group p-5 animate-native-fast">
              <div className="flex items-center justify-between mb-4">
                <span className="text-caption-native text-zinc-500 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">{i.category || 'General'}</span>
                {i.notion_url && (
                   <a href={i.notion_url} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-zinc-900 transition-colors relative z-10">
                     <ExternalLink className="w-4 h-4" />
                   </a>
                )}
              </div>
              <p className="text-body-native font-500 text-zinc-800 leading-relaxed flex-1">
                {i.content}
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-body-secondary font-500">
                <span>{new Date(i.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <Lightbulb className="w-4 h-4 opacity-50 text-zinc-400" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  )
}
