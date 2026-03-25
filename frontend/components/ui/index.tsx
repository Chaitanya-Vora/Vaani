'use client'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-display font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-full',
        {
          'bg-zinc-900 hover:bg-zinc-800 text-white shadow-md': variant === 'primary',
          'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700': variant === 'ghost',
          'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100': variant === 'danger',
          'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100': variant === 'success',
          'px-4 py-2 text-xs': size === 'sm',
          'px-6 py-2.5 text-sm': size === 'md',
          'px-8 py-3.5 text-base': size === 'lg',
        },
        className,
      )}
      {...p}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm', className)} {...p}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { color?: 'brand'|'teal'|'warning'|'danger'|'success'|'muted'; children: React.ReactNode; className?: string }
export function Badge({ color = 'muted', className, children }: BadgeProps) {
  return (
    <span className={clsx('text-[10px] sm:text-xs font-display font-bold px-2.5 py-1 rounded-md uppercase tracking-wide', {
      'bg-orange-50 text-orange-600': color === 'brand',
      'bg-emerald-50 text-emerald-600': color === 'teal',
      'bg-amber-50 text-amber-600': color === 'warning',
      'bg-red-50 text-red-600': color === 'danger',
      'bg-green-100 text-green-700': color === 'success',
      'bg-zinc-100 text-zinc-600': color === 'muted',
    }, className)}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...p }, ref) => (
  <div className="w-full">
    {label && <label className="text-zinc-600 text-xs sm:text-sm font-display font-bold mb-1.5 block tracking-wide uppercase">{label}</label>}
    <input ref={ref}
      className={clsx('bg-zinc-50 border rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all duration-200 w-full font-body text-sm',
        error ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
               : 'border-zinc-200 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-100 hover:border-zinc-300',
        className)}
      {...p}
    />
    {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: {value:string;label:string}[] }
export function Select({ label, options, className, ...p }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="text-zinc-600 text-xs sm:text-sm font-display font-bold mb-1.5 block tracking-wide uppercase">{label}</label>}
      <select className={clsx('bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-zinc-400 hover:border-zinc-300 transition-all w-full font-body text-sm appearance-none', className)} {...p}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm'|'md'|'lg' }) {
  return <Loader2 className={clsx('animate-spin text-zinc-900', { 'w-4 h-4': size==='sm', 'w-6 h-6': size==='md', 'w-8 h-8': size==='lg' })} />
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, trend }: { label:string; value:string|number; sub?:string; icon?:any; trend?: 'up'|'down' }) {
  return (
    <Card className="flex items-start justify-between gap-4 border-zinc-200 bg-white">
      <div>
        <p className="text-zinc-500 text-xs font-display font-bold uppercase tracking-widest mb-2">{label}</p>
        <p className="text-2xl font-display font-800 text-zinc-900">{value}</p>
        {sub && <p className="text-zinc-400 text-xs mt-1 font-medium">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-zinc-700" />
        </div>
      )}
    </Card>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-2 shadow-sm">
        <Icon className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-zinc-900 font-display font-800 text-lg tracking-tight">{title}</p>
      <p className="text-zinc-500 text-sm max-w-sm font-medium">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'zinc' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  const col = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-400' : 'bg-zinc-900'
  return (
    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
      <div className={clsx('h-full rounded-full transition-all duration-500', col)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={clsx('relative w-11 h-6 rounded-full transition-colors duration-200 border', checked ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-100 border-zinc-200')}>
      <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  )
}
