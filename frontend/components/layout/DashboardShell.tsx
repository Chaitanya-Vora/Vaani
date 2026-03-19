'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, AlertCircle, Users, Zap, Plug, CreditCard,
  LogOut, Menu, X, MessageCircle, Bell, ChevronRight,
  Mic, FileText, Settings, Target,
} from 'lucide-react'
import { clearToken } from '@/lib/api'

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Command Center' },
  { href: '/dashboard/commitments',  icon: Target,     label: 'Commitments' },
  { href: '/dashboard/clients',      icon: Users,           label: 'Lead Sniper CRM' },
  { href: '/dashboard/automations',  icon: Zap,             label: 'Automations' },
  { href: '/dashboard/integrations', icon: Plug,            label: 'Integrations' },
  { href: '/dashboard/billing',      icon: CreditCard,      label: 'Billing' },
]

export default function DashboardLayout({ children, user }: { children: React.ReactNode; user?: any }) {
  const path     = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const logout = () => { clearToken(); router.push('/auth/login') }

  const Sidebar = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col bg-bg-surface border-r border-bg-border h-full',
      mobile ? 'w-full' : 'w-64 min-h-screen',
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-bg-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-700 text-text-primary text-lg">Vaani</span>
        </Link>
        {mobile && <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-text-muted" /></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-500 transition-all duration-150',
                active
                  ? 'bg-brand/10 text-brand-light border border-brand/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated',
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand" />}
            </Link>
          )
        })}
      </nav>

      {/* Usage bar */}
      {user && (
        <div className="px-4 py-3 mx-3 mb-3 bg-bg-elevated rounded-xl border border-bg-border">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-text-muted text-xs font-display">Tasks used</span>
            <span className="text-text-secondary text-xs font-mono">{user.tasks_used}/{user.tasks_limit === 999999 ? '∞' : user.tasks_limit}</span>
          </div>
          <div className="w-full bg-bg-border rounded-full h-1.5">
            <div className={clsx('h-1.5 rounded-full transition-all', user.tasks_used / user.tasks_limit > 0.9 ? 'bg-danger' : 'bg-brand')}
              style={{ width: `${Math.min(100, (user.tasks_used / (user.tasks_limit || 50)) * 100)}%` }} />
          </div>
          <p className="text-text-muted text-xs mt-1.5 capitalize">{user.plan} plan</p>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-bg-border pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-bg-elevated transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand font-display font-700 text-sm">
              {user?.name?.[0]?.toUpperCase() || 'V'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-display font-600 truncate">{user?.name || 'User'}</p>
            <p className="text-text-muted text-xs truncate">{user?.business_name || ''}</p>
          </div>
          <button onClick={logout} className="text-text-muted hover:text-danger transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-bg-base">
      {/* Desktop sidebar */}
      <div className="hidden lg:block"><Sidebar /></div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 z-10"><Sidebar mobile /></div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-bg-border bg-bg-surface/80 backdrop-blur-md flex items-center px-4 gap-4 sticky top-0 z-40">
          <button onClick={() => setOpen(true)} className="lg:hidden text-text-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <a href="https://wa.me/" target="_blank" rel="noopener"
              className="flex items-center gap-2 text-xs text-text-secondary hover:text-teal transition-colors border border-bg-border hover:border-teal/40 rounded-lg px-3 py-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-teal" />
              Open WhatsApp
            </a>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
