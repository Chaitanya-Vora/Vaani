'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic } from 'lucide-react'
import { api, setToken } from '@/lib/api'
import { Button, Input, Select } from '@/components/ui'

const BUSINESS_TYPES = [
  { value: 'startup',           label: 'Startup / Tech Company' },
  { value: 'msme',              label: 'MSME / Small Business' },
  { value: 'ca_firm',          label: 'CA Firm / Accounting' },
  { value: 'aif',              label: 'AIF / PMS / Investment Firm' },
  { value: 'freelancer',       label: 'Freelancer / Consultant' },
  { value: 'd2c',              label: 'D2C Brand / E-commerce' },
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    business_name: '', business_type: 'msme',
    whatsapp_number: '', language_pref: 'en',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res: any = await api.auth.signup(form)
      setToken(res.access_token)
      router.push('/dashboard?welcome=1')
    } catch (err: any) { setError(err.message || 'Signup failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 py-12">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 shadow-sm flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-800 tracking-tight text-2xl text-zinc-900">Vaani</span>
          </Link>
          <h1 className="font-display font-800 tracking-tight text-3xl text-zinc-900 mb-2">Start your 7-day free trial</h1>
          <p className="text-zinc-500 font-medium text-sm">No credit card required. Cancel anytime.</p>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-xl shadow-zinc-200/40">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 font-medium text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" placeholder="Rajesh Mehta" required value={form.name} onChange={set('name')} />
              <Input label="Company Name" placeholder="Mehta & Co." required value={form.business_name} onChange={set('business_name')} />
            </div>
            <Input label="Work Email" type="email" placeholder="you@company.com" required value={form.email} onChange={set('email')} />
            <Input label="Password" type="password" placeholder="Min 8 characters" required minLength={8} value={form.password} onChange={set('password')} />
            <Select label="Business Type" value={form.business_type} onChange={set('business_type')} options={BUSINESS_TYPES} />
            <Input label="WhatsApp Number (+91)" placeholder="+919876543210" type="tel"
              value={form.whatsapp_number} onChange={set('whatsapp_number')} />
            <Select label="Preferred AI Language" value={form.language_pref} onChange={set('language_pref')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi / Hinglish' },
                { value: 'mr', label: 'Marathi' },
                { value: 'gu', label: 'Gujarati' },
                { value: 'ta', label: 'Tamil' },
              ]} />
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Start free trial &rarr;
            </Button>
          </form>
          <p className="text-zinc-400 font-medium text-[11px] text-center mt-5 leading-relaxed">
            By continuing, you agree to our{' '}
            <span className="text-zinc-700 font-bold cursor-pointer hover:underline">Terms of Service</span> and{' '}
            <span className="text-zinc-700 font-bold cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
          <p className="text-center font-medium text-zinc-500 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-zinc-900 hover:underline font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
