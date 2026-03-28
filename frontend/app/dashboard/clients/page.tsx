'use client'
import { useEffect, useState } from 'react'
import { Users, Phone, Mail, Building, MoreVertical, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'
import { PremiumEmptyState } from '@/components/ui/EmptyState'

export default function ClientsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.dashboard.me(), api.dashboard.clients()])
      .then(([u, c]) => { setUser(u); setClients(c as any[]); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, scale: 0.98 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 px-1">
        <div>
          <h1 className="text-title-1 text-zinc-900 mb-1">Lead Sniper CRM</h1>
          <p className="text-body-secondary mt-1">
            Forward a VCF card or raw voice note on WhatsApp to auto-inject leads here.
          </p>
        </div>
        <button className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-700 px-6 py-2.5 rounded-full transition-all shadow-sm w-full sm:w-auto active:scale-95">
          + Add Lead Manually
        </button>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clients.length === 0 && (
          <div className="col-span-full">
            <PremiumEmptyState
              icon={Users}
              title="No verified leads captured yet"
              description="Forward a standard VCF card or a voice note on WhatsApp to log your first lead automatically."
              actionLabel="+ Add Lead Manually"
              onAction={() => console.log('Add lead')}
            />
          </div>
        )}
        {clients.map(c => {
          const status = c.tags?.length > 0 ? c.tags[0] : 'Lead';
          return (
          <motion.div variants={itemFramer} key={c.id}>
            <div className="native-card group relative p-5 h-full flex flex-col active:scale-[0.98] transition-all animate-native-fast overflow-hidden">
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-lg bg-zinc-900 flex items-center justify-center font-800 text-white native-border shadow-sm text-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-700 text-zinc-900 text-[17px] truncate tracking-tight">{c.name}</h3>
                    <p className="text-body-secondary mt-0.5 truncate uppercase tracking-wide font-800 text-[10px]">{c.company || 'Unknown Entity'}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  <Badge color={status.includes('Lead') ? 'brand' : 'success'} className="text-caption-native px-2 py-0.5">{status}</Badge>
                </div>
              </div>

              <div className="space-y-3 flex-1 relative z-10 font-body">
                <div className="flex items-center gap-3 text-body-secondary truncate">
                  <Mail className="w-4 h-4 text-zinc-400" /> {c.email || 'No email associated'}
                </div>
                <div className="flex items-center gap-3 text-body-secondary truncate">
                  <Phone className="w-4 h-4 text-zinc-400" /> {c.phone || 'No phone configured'}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-body-secondary relative z-10">
                <span>Last action: <span className="text-zinc-900 font-700">{c.last_contacted ? new Date(c.last_contacted).toLocaleDateString() : 'Pending'}</span></span>
                <span className="cursor-pointer hover:text-zinc-900 transition-colors text-zinc-900 flex items-center gap-1 font-800">Notion <ExternalLink className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </motion.div>
        )})}
      </motion.div>
    </DashboardShell>
  )
}
