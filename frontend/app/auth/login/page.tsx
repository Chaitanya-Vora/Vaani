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
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 shadow-sm flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-800 text-2xl tracking-tight text-zinc-900">Vaani</span>
          </Link>
          <h1 className="font-display font-800 tracking-tight text-3xl text-zinc-900 mb-2">Welcome Back</h1>
          <p className="text-zinc-500 font-medium text-sm">Log in to your command center</p>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-xl shadow-zinc-200/40">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 font-medium text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email address" type="email" placeholder="you@company.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div className="relative">
              <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">Sign In</Button>
          </form>
          <p className="text-center font-medium text-zinc-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-zinc-900 hover:underline font-bold">Start free trial</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
