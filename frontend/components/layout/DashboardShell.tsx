'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Zap, Plug, CreditCard,
  LogOut, Menu, X, Send, ChevronRight,
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
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold animate-native-fast',
                active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              )}>
              {/* Pill Indicator (56x28px logic) */}
              {active && (
                <motion.div 
                  layoutId="nav-pill"
                  className="absolute inset-y-1.5 left-2 w-[56px] bg-zinc-100 rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                />
              )}
              <div className={clsx(
                "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                active ? "" : "group-hover:bg-zinc-100/50"
              )}>
                <Icon className={clsx("w-4 h-4 flex-shrink-0", active ? "text-zinc-900" : "text-zinc-400")} />
              </div>
              <span className="relative z-10">{label}</span>
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
        <button 
          onClick={logout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-100 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-900 font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'V'}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-zinc-900 text-xs font-bold truncate">{user?.name || 'User'}</p>
              <p className="text-zinc-400 text-[10px] font-medium">Log out</p>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
        </button>
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

      {/* Mobile nav (Absolute Native Pill-Nav) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white border-t border-zinc-100 px-4 flex items-center justify-between"
        style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 group">
              <div className={clsx(
                "w-14 h-7 rounded-full flex items-center justify-center animate-native-medium",
                active ? "bg-zinc-900 text-white" : "text-zinc-400 group-hover:bg-zinc-100"
              )}>
                <Icon className={clsx("w-5 h-5", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={clsx(
                "text-caption-native leading-none mt-1 transition-colors duration-200",
                active ? "text-zinc-900 font-800" : "text-zinc-400 font-500"
              )}>{label}</span>
            </Link>
          )
        })}
        {/* More button to trigger sidebar */}
        <button onClick={() => setOpen(true)} className="flex-1 flex flex-col items-center gap-1 text-zinc-400 group">
          <div className="w-14 h-7 rounded-full flex items-center justify-center group-hover:bg-zinc-100 transition-all duration-200">
            <Menu className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-caption-native leading-none mt-1 font-500">More</span>
        </button>
      </nav>

      {/* Telegram FAB (Mobile Only) */}
      <a href="https://t.me/vaani_os_bot" target="_blank" rel="noopener"
        className="fixed bottom-24 right-5 z-[90] lg:hidden w-12 h-12 bg-zinc-900 rounded-full shadow-xl flex items-center justify-center border border-zinc-800 active:scale-95 transition-transform">
        <Send className="w-5 h-5 text-white" />
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
        {/* Top bar (Identity-First on mobile) */}
        <header className="h-[56px] border-b border-zinc-100 bg-white flex items-center px-4 gap-4 sticky top-0 z-40">
          <div className="flex-1 flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm lg:hidden">
                <ZapIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-title-2 font-800 text-zinc-900 tracking-tight lg:text-sm lg:uppercase">
                Vaani OS
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2">
                <a href="https://t.me/vaani_os_bot" target="_blank" rel="noopener"
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 shadow-sm rounded-full px-4 py-2 hover:shadow-md">
                  <Send className="w-4 h-4 text-zinc-900" />
                  Open Telegram Bot
                </a>
             </div>
             <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center lg:hidden overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-900 font-bold text-xs">{user?.name?.[0] || 'V'}</span>
                )}
             </div>
          </div>
        </header>

        <main className={clsx(
          "flex-1 p-4 lg:p-10 bg-white",
          "pb-28 lg:pb-10" // Leave space for Bottom Nav on mobile
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
