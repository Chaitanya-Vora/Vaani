'use client'
import { useEffect, useState } from 'react'
import { Users, Phone, Mail, Building, MoreVertical, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner } from '@/components/ui'

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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
        <div>
          <h1 className="font-display font-800 text-3xl text-zinc-900 mb-1 tracking-tight">Lead Sniper CRM</h1>
          <p className="text-zinc-500 font-medium text-sm sm:text-base">
            Forward a VCF card or raw voice note on WhatsApp to auto-inject leads here.
          </p>
        </div>
        <button className="bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-display font-700 px-6 py-2.5 rounded-full transition-all shadow-sm w-full sm:w-auto">
          + Add Lead Manually
        </button>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.length === 0 && (
          <div className="col-span-full text-center py-24 px-4 bg-zinc-50 border border-zinc-200 rounded-[2rem]">
            <Users className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-600 text-base font-bold">No verified leads captured yet.</p>
            <p className="text-zinc-400 font-medium text-sm mt-1">Forward a standard VCF card on WhatsApp to log your first lead.</p>
          </div>
        )}
        {clients.map(c => {
          const status = c.tags?.length > 0 ? c.tags[0] : 'Lead';
          return (
          <motion.div variants={itemFramer} key={c.id}>
            <Card className="hover:border-zinc-300 bg-white border-zinc-200 shadow-sm transition-all group relative overflow-hidden p-6 rounded-3xl h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center font-display font-800 text-zinc-900 border border-zinc-200 text-lg shadow-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-800 tracking-tight text-zinc-900 text-lg">{c.name}</h3>
                    <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">POC: {c.company || 'Unknown Entity'}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge color={status.includes('Lead') ? 'brand' : 'success'} className="uppercase tracking-widest text-[9px] font-bold px-2 py-1">{status}</Badge>
                  <button 
                    onClick={() => alert(`Options for ${c.name}: \n1. View in Notion\n2. Call Lead\n3. Delete`)}
                    className="text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1 relative z-10">
                <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                  <Mail className="w-4 h-4 text-zinc-400" /> {c.email || 'No email associated'}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-zinc-600">
                  <Phone className="w-4 h-4 text-zinc-400" /> {c.phone || 'No phone configured'}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-xs font-semibold text-zinc-400 relative z-10">
                <span>Last action: <span className="text-zinc-900">{c.last_contacted ? new Date(c.last_contacted).toLocaleDateString() : 'Pending'}</span></span>
                <span className="cursor-pointer hover:text-brand transition-colors text-brand flex items-center gap-1">Notion <ExternalLink className="w-3 h-3" /></span>
              </div>
            </Card>
          </motion.div>
        )})}
      </motion.div>
    </DashboardShell>
  )
}
