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
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 py-12">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-brand/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-xl text-text-primary">Vaani</span>
          </Link>
          <h1 className="font-display font-700 text-2xl text-text-primary mb-2">7 din free shuru karo</h1>
          <p className="text-text-secondary text-sm">Koi credit card nahi. UPI se baad mein pay karo.</p>
        </div>

        <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 surface-glow">
          {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Aapka naam" placeholder="Rajesh Mehta" required value={form.name} onChange={set('name')} />
              <Input label="Business naam" placeholder="Mehta & Co." required value={form.business_name} onChange={set('business_name')} />
            </div>
            <Input label="Email" type="email" placeholder="aap@company.com" required value={form.email} onChange={set('email')} />
            <Input label="Password" type="password" placeholder="Min 8 characters" required minLength={8} value={form.password} onChange={set('password')} />
            <Select label="Business type" value={form.business_type} onChange={set('business_type')} options={BUSINESS_TYPES} />
            <Input label="WhatsApp number (with +91)" placeholder="+919876543210" type="tel"
              value={form.whatsapp_number} onChange={set('whatsapp_number')} />
            <Select label="Preferred language" value={form.language_pref} onChange={set('language_pref')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi' },
                { value: 'mr', label: 'Marathi' },
                { value: 'gu', label: 'Gujarati' },
                { value: 'ta', label: 'Tamil' },
              ]} />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Free trial shuru karo →
            </Button>
          </form>
          <p className="text-text-muted text-xs text-center mt-4 leading-relaxed">
            Continue karne par aap hamare{' '}
            <span className="text-brand-light cursor-pointer">Terms of Service</span> aur{' '}
            <span className="text-brand-light cursor-pointer">Privacy Policy</span> se agree karte hain.
          </p>
          <p className="text-center text-text-muted text-sm mt-3">
            Pehle se account hai?{' '}
            <Link href="/auth/login" className="text-brand-light hover:underline font-500">Login karo</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
