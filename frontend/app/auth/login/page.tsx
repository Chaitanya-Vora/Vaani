'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic, Eye, EyeOff } from 'lucide-react'
import { api, setToken } from '@/lib/api'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res: any = await api.auth.login(form)
      setToken(res.access_token)
      router.push('/dashboard')
    } catch (err: any) { setError(err.message || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <Mic className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-display font-700 text-xl text-text-primary">Vaani</span>
          </Link>
          <h1 className="font-display font-700 text-2xl text-text-primary mb-2">Wapas aaye!</h1>
          <p className="text-text-secondary text-sm">Apne account mein login karo</p>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 surface-glow">
          {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" placeholder="aap@company.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div className="relative">
              <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Login karo</Button>
          </form>
          <p className="text-center text-text-muted text-sm mt-5">
            Account nahi hai?{' '}
            <Link href="/auth/signup" className="text-brand-light hover:underline font-500">Free trial shuru karo</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
