'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Zap, Plug, CreditCard,
  LogOut, Menu, X, MessageCircle, ChevronRight,
  Target, Zap as ZapIcon, LayoutPanelLeft, Lightbulb, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clearToken } from '@/lib/api'

const NAV = [
  { href: '/dashboard',              icon: LayoutDashboard, label: 'Command Center' },
  { href: '/dashboard/tasks',        icon: CheckCircle,     label: 'Priority Tasks' },
  { href: '/dashboard/commitments',  icon: Target,          label: 'Commitments' },
  { href: '/dashboard/ideas',        icon: Lightbulb,       label: 'Idea Vault' },
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

  const getTrialDaysLeft = () => {
    if (!user?.trial_ends_at || user.plan_status !== 'trial') return null;
    const diff = new Date(user.trial_ends_at).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };
  const trialDays = getTrialDaysLeft();

  const Sidebar = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col bg-[#fafafa] border-r border-zinc-200 h-full',
      mobile ? 'w-full' : 'w-64 min-h-screen',
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-zinc-900 flex items-center justify-center shadow-sm">
            <ZapIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-700 text-zinc-900 text-lg tracking-tight">Vaani OS</span>
        </Link>
        {mobile && <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-zinc-400" /></button>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                active
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50',
              )}>
              <Icon className={clsx("w-4 h-4 flex-shrink-0", active ? "text-zinc-900" : "")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Usage bar */}
      {user && (
        <div className="px-4 py-3 mx-3 mb-3 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-zinc-500 text-xs font-semibold">Tasks Used</span>
              <span className="text-zinc-900 text-xs font-bold">{user.tasks_used}/{user.tasks_limit === 999999 ? '∞' : user.tasks_limit}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5">
              <div className={clsx('h-1.5 rounded-full transition-all', user.tasks_used / user.tasks_limit > 0.9 ? 'bg-red-500' : 'bg-zinc-900')}
                style={{ width: `${Math.min(100, (user.tasks_used / (user.tasks_limit || 50)) * 100)}%` }} />
            </div>
          </div>
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">{user.plan} plan</p>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-zinc-200 pt-3">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-900 font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'V'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 text-xs font-bold truncate">{user?.name || 'User'}</p>
            </div>
          </div>
          <button onClick={logout} className="text-zinc-400 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )

  const MOBILE_NAV = [
    { href: '/dashboard',         icon: LayoutDashboard, label: 'Dash' },
    { href: '/dashboard/tasks',   icon: CheckCircle,     label: 'Tasks' },
    { href: '/dashboard/clients', icon: Users,           label: 'CRM' },
    { href: '/dashboard/integrations', icon: Plug,       label: 'Tools' },
  ]

  return (
    <div className="flex min-h-screen bg-white font-body selection:bg-zinc-900 selection:text-white">
      {/* Desktop sidebar */}
      <div className="hidden lg:block"><Sidebar /></div>

      {/* Mobile nav (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden glass safe-bottom px-6 py-3 flex items-center justify-between shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)]">
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href} className={clsx(
              'flex flex-col items-center gap-1 transition-all duration-200',
              active ? 'text-zinc-900 scale-105' : 'text-zinc-400'
            )}>
              <Icon className={clsx("w-5 h-5", active ? "fill-zinc-900/5 stroke-[2.5px]" : "stroke-[2px]")} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            </Link>
          )
        })}
        {/* More button to trigger sidebar */}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 text-zinc-400">
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">More</span>
        </button>
      </nav>

      {/* WhatsApp FAB (Mobile Only) */}
      <a href="https://wa.me/" target="_blank" rel="noopener"
        className="fixed bottom-24 right-5 z-[90] lg:hidden w-12 h-12 bg-zinc-900 rounded-full shadow-xl flex items-center justify-center border border-zinc-800 active:scale-95 transition-transform">
        <MessageCircle className="w-6 h-6 text-green-500 fill-green-500/20" />
      </a>

      {/* Mobile Sidebar Overlay (for "More") */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[110] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] z-10 shadow-2xl"
            >
              <Sidebar mobile />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (Compact on mobile) */}
        <header className="h-14 lg:h-16 border-b border-zinc-100 bg-white/80 backdrop-blur-md flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-40">
          <div className="flex-1 flex items-center text-xs lg:text-sm font-bold text-zinc-900 tracking-tight uppercase">
            <LayoutPanelLeft className="w-4 h-4 mr-2 text-zinc-400" /> 
            Vaani OS
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2">
                <a href="https://wa.me/" target="_blank" rel="noopener"
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 shadow-sm rounded-full px-4 py-2 hover:shadow-md">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  Open WhatsApp
                </a>
             </div>
             <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center lg:hidden">
                <span className="text-zinc-900 font-bold text-xs">{user?.name?.[0]}</span>
             </div>
          </div>
        </header>

        <main className={clsx(
          "flex-1 p-5 lg:p-10 bg-white",
          "pb-28 lg:pb-10" // Leave space for Bottom Nav on mobile
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
