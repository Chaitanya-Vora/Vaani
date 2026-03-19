'use client'
import { useEffect, useState } from 'react'
import { Users, Search, Phone, Mail, IndianRupee, Clock, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Badge, Spinner, Empty } from '@/components/ui'

export default function ClientsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    Promise.all([api.dashboard.me(), api.dashboard.clients()])
      .then(([u, c]) => { setUser(u); setClients(c) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  return (
    <DashboardShell user={user}>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Clients / CRM</h1>
          <p className="text-text-secondary text-sm">WhatsApp se auto-updated — {clients.length} clients</p>
        </div>
        <div className="bg-bg-elevated/50 border border-bg-border rounded-xl px-3 py-2 flex items-center gap-2 w-64">
          <Search className="w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none flex-1" />
        </div>
      </div>

      {/* Info */}
      <div className="bg-teal/5 border border-teal/15 rounded-xl p-4 mb-6 flex gap-3">
        <Users className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
        <p className="text-text-secondary text-sm">
          Clients automatically add ho jaate hain jab aap WhatsApp pe unka naam mention karte ho. 
          <span className="text-text-primary"> "Sharma ji se call hua aaj" — CRM update!</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={Users} title="Koi client nahi abhi tak"
          description='WhatsApp pe "Mehta ji se meeting hui aaj" bhejo — client automatically add ho jaayega.' />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: any) => (
            <Card key={c.id} className="hover:border-brand/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-700 text-brand">{c.name[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-display font-600 text-text-primary">{c.name}</p>
                    {c.company && <p className="text-text-muted text-xs">{c.company}</p>}
                  </div>
                </div>
                {c.outstanding_inr > 0 && (
                  <Badge color="warning">₹{c.outstanding_inr.toLocaleString('en-IN')}</Badge>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-text-muted">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 hover:text-text-secondary transition-colors">
                    <Phone className="w-3.5 h-3.5" />{c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-text-secondary transition-colors">
                    <Mail className="w-3.5 h-3.5" />{c.email}
                  </a>
                )}
                {c.last_contacted && (
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Last contact: {new Date(c.last_contacted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              {c.next_followup && (
                <div className="mt-3 pt-3 border-t border-bg-border">
                  <p className="text-xs text-warning flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Follow-up: {new Date(c.next_followup).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )}
              {c.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.tags.slice(0, 3).map((t: string) => (
                    <span key={t} className="text-xs bg-bg-hover text-text-muted px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
