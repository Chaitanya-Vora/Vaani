'use client'
import { useEffect, useState } from 'react'
import { Users, Phone, Mail, Building, MoreVertical } from 'lucide-react'
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
      .then(([u, c]) => { setUser(u); setClients(c); })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  const containerFramer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemFramer = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <DashboardShell user={user}>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary mb-1 tracking-tight">Lead Sniper CRM</h1>
          <p className="text-text-secondary text-sm">
            Forward a VCF map or voice note on WhatsApp to auto-inject leads here.
          </p>
        </div>
        <button className="bg-brand hover:bg-brand-light text-white text-sm font-display font-600 px-4 py-2 rounded-xl transition-all shadow-brand">
          + Add Lead Manually
        </button>
      </div>

      <motion.div variants={containerFramer} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-4">
        {clients.length === 0 && (
          <div className="col-span-2 text-center py-20 px-4 bg-bg-surface border border-bg-border rounded-2xl">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-text-muted text-sm font-500">No leads captured yet.</p>
            <p className="text-text-muted text-xs mt-1">Forward a VCF card on WhatsApp to log your first lead.</p>
          </div>
        )}
        {clients.map(c => {
          const status = c.tags?.length > 0 ? c.tags[0] : 'Lead';
          return (
          <motion.div variants={itemFramer} key={c.id}>
            <Card className="hover:border-teal/30 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center font-display font-700 text-teal border border-bg-border">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-text-primary text-sm">{c.name}</h3>
                    <p className="text-text-muted text-[11px] uppercase tracking-wider font-600 mt-0.5">POC: {c.company || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge color={status.includes('Lead') ? 'brand' : 'success'} className="uppercase tracking-wider text-[9px] px-2">{status}</Badge>
                  <button className="text-text-muted hover:text-text-primary transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Mail className="w-3.5 h-3.5 text-text-muted" /> {c.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-muted" /> {c.phone || 'No phone provided'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-bg-border/50 flex justify-between items-center text-[11px] text-text-muted">
                <span>Last contact: <span className="text-text-primary">{c.last_contacted ? new Date(c.last_contacted).toLocaleDateString() : 'Never'}</span></span>
                <span className="cursor-pointer hover:text-brand transition-colors">View Notion Node →</span>
              </div>
            </Card>
          </motion.div>
        )})}
      </motion.div>
    </DashboardShell>
  )
}
