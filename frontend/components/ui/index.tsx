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
        'inline-flex items-center justify-center gap-2 font-display font-600 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-brand hover:bg-brand-light text-white hover:shadow-glow-sm': variant === 'primary',
          'bg-transparent border border-bg-border hover:border-brand/40 text-text-secondary hover:text-text-primary': variant === 'ghost',
          'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20': variant === 'danger',
          'bg-success/10 border border-success/30 text-success hover:bg-success/20': variant === 'success',
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-5 py-2.5 text-sm': size === 'md',
          'px-7 py-3.5 text-base': size === 'lg',
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
    <div className={clsx('bg-bg-surface border border-bg-border rounded-2xl p-6 surface-glow', className)} {...p}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { color?: 'brand'|'teal'|'warning'|'danger'|'success'|'muted'; children: React.ReactNode; className?: string }
export function Badge({ color = 'muted', className, children }: BadgeProps) {
  return (
    <span className={clsx('text-xs font-display font-600 px-2.5 py-1 rounded-full', {
      'bg-brand/15 text-brand-light': color === 'brand',
      'bg-teal/15 text-teal': color === 'teal',
      'bg-warning/15 text-warning': color === 'warning',
      'bg-danger/15 text-danger': color === 'danger',
      'bg-success/15 text-success': color === 'success',
      'bg-bg-hover text-text-secondary': color === 'muted',
    }, className)}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...p }, ref) => (
  <div className="w-full">
    {label && <label className="text-text-secondary text-sm font-display font-500 mb-1.5 block">{label}</label>}
    <input ref={ref}
      className={clsx('bg-bg-elevated border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none transition-all duration-200 w-full font-body text-sm',
        error ? 'border-danger/60 focus:border-danger focus:ring-1 focus:ring-danger/20'
               : 'border-bg-border focus:border-brand/60 focus:ring-1 focus:ring-brand/20',
        className)}
      {...p}
    />
    {error && <p className="text-danger text-xs mt-1.5">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: {value:string;label:string}[] }
export function Select({ label, options, className, ...p }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="text-text-secondary text-sm font-display font-500 mb-1.5 block">{label}</label>}
      <select className={clsx('bg-bg-elevated border border-bg-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand/60 transition-all w-full font-body text-sm appearance-none', className)} {...p}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm'|'md'|'lg' }) {
  return <Loader2 className={clsx('animate-spin text-brand', { 'w-4 h-4': size==='sm', 'w-6 h-6': size==='md', 'w-8 h-8': size==='lg' })} />
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, trend }: { label:string; value:string|number; sub?:string; icon?:any; trend?: 'up'|'down' }) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-text-muted text-xs font-display font-600 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-2xl font-display font-700 text-text-primary">{value}</p>
        {sub && <p className="text-text-secondary text-xs mt-1">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand" />
        </div>
      )}
    </Card>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center mb-2">
        <Icon className="w-7 h-7 text-text-muted" />
      </div>
      <p className="text-text-primary font-display font-600">{title}</p>
      <p className="text-text-muted text-sm max-w-xs">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'brand' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  const col = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-brand'
  return (
    <div className="w-full bg-bg-border rounded-full h-1.5">
      <div className={clsx('h-1.5 rounded-full transition-all duration-500', col)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={clsx('relative w-10 h-5 rounded-full transition-colors duration-200', checked ? 'bg-brand' : 'bg-bg-border')}>
      <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}
