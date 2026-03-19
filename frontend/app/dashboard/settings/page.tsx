'use client'
import { useEffect, useState } from 'react'
import { Save, MessageCircle, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import DashboardShell from '@/components/layout/DashboardShell'
import { Card, Button, Input, Select, Spinner } from '@/components/ui'

export default function SettingsPage() {
  const [user,    setUser]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [form,    setForm]    = useState({
    name: '', business_name: '', gstin: '',
    whatsapp_number: '', language_pref: 'en', business_type: 'msme',
  })
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api.dashboard.me().then((u: any) => {
      setUser(u)
      setForm({
        name: u.name || '', business_name: u.business_name || '',
        gstin: u.gstin || '', whatsapp_number: u.whatsapp_number || '',
        language_pref: u.language_pref || 'en', business_type: u.business_type || 'msme',
      })
    }).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.dashboard.update(form)
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <DashboardShell><div className="flex justify-center py-24"><Spinner size="lg" /></div></DashboardShell>

  return (
    <DashboardShell user={user}>
      <div className="mb-6">
        <h1 className="font-display font-700 text-2xl text-text-primary mb-1">Settings</h1>
        <p className="text-text-secondary text-sm">Profile aur business preferences update karo</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <h3 className="font-display font-600 text-text-primary mb-5">Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Aapka naam" value={form.name} onChange={set('name')} placeholder="Rajesh Mehta" />
              <Input label="Business naam" value={form.business_name} onChange={set('business_name')} placeholder="Mehta & Co." />
            </div>
            <Input label="Email" value={user?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
            <Input label="GSTIN (optional)" value={form.gstin} onChange={set('gstin')}
              placeholder="22AAAAA0000A1Z5" maxLength={15}
              help="Invoice generation aur compliance tracking ke liye" />
            <Select label="Business type" value={form.business_type} onChange={set('business_type')}
              options={[
                { value: 'startup',    label: 'Startup / Tech' },
                { value: 'msme',       label: 'MSME / Small Business' },
                { value: 'ca_firm',    label: 'CA Firm' },
                { value: 'aif',        label: 'AIF / PMS / Investment' },
                { value: 'freelancer', label: 'Freelancer / Consultant' },
                { value: 'd2c',        label: 'D2C / E-commerce' },
              ]} />
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-600 text-text-primary mb-5">Messaging</h3>
          <div className="space-y-4">
            <div>
              <Input label="WhatsApp number (+91 ke saath)" value={form.whatsapp_number}
                onChange={set('whatsapp_number')} placeholder="+919876543210" />
              <p className="text-text-muted text-xs mt-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Isi number pe reminders aur responses aayenge
              </p>
            </div>
            <Select label="Preferred language" value={form.language_pref} onChange={set('language_pref')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi (हिंदी)' },
                { value: 'mr', label: 'Marathi (मराठी)' },
                { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
                { value: 'ta', label: 'Tamil (தமிழ்)' },
                { value: 'te', label: 'Telugu (తెలుగు)' },
              ]} />
          </div>
        </Card>

        <Card className="bg-bg-elevated">
          <h3 className="font-display font-600 text-text-primary mb-3">WhatsApp setup guide</h3>
          <ol className="space-y-3 text-sm text-text-secondary">
            {[
              'Apne phone mein +91-XXXXX-XXXXX ko "Vaani AI" naam se save karo',
              'WhatsApp pe "Hello Vaani" bhejo — aapka account link ho jaayega',
              'Pehla voice note bhejo — magic dekhein!',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand/15 text-brand text-xs font-display font-700 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={save} loading={saving}>
            <Save className="w-4 h-4" />
            {saved ? 'Saved ✓' : 'Save karo'}
          </Button>
          {saved && <span className="text-success text-sm font-display">Changes save ho gaye!</span>}
        </div>
      </div>
    </DashboardShell>
  )
}
