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
      <div className="mb-8">
        <h1 className="font-display font-800 text-3xl text-zinc-900 mb-2 tracking-tight">Organization Settings</h1>
        <p className="text-zinc-500 font-medium text-base">Manage your executive profile and Vaani operational preferences.</p>
      </div>

      <div className="max-w-3xl space-y-8">
        <Card className="bg-white border-zinc-200 shadow-sm p-8 rounded-[2rem]">
          <h3 className="font-display font-800 text-xl text-zinc-900 mb-6 tracking-tight">Executive Profile</h3>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Rajesh Mehta" />
              <Input label="Company Name" value={form.business_name} onChange={set('business_name')} placeholder="Mehta & Co." />
            </div>
            <Input label="Registered Email" value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed bg-zinc-50" />
            <div>
              <Input label="GSTIN (Optional)" value={form.gstin} onChange={set('gstin')}
                placeholder="22AAAAA0000A1Z5" maxLength={15} />
              <p className="text-zinc-400 text-[11px] font-bold mt-2 ml-1">Utilized for automated invoice generation and compliance reporting.</p>
            </div>
            <Select label="Entity Classification" value={form.business_type} onChange={set('business_type')}
              options={[
                { value: 'startup',    label: 'Venture Backed Startup' },
                { value: 'msme',       label: 'MSME / Retail' },
                { value: 'ca_firm',    label: 'CA / Accounting Agency' },
                { value: 'aif',        label: 'AIF / PMS / PE Firm' },
                { value: 'freelancer', label: 'Independent Consultant' },
                { value: 'd2c',        label: 'D2C / E-commerce Brand' },
              ]} />
          </div>
        </Card>

        <Card className="bg-white border-zinc-200 shadow-sm p-8 rounded-[2rem]">
          <h3 className="font-display font-800 text-xl text-zinc-900 mb-6 tracking-tight">Secure Communications</h3>
          <div className="space-y-6">
            <div>
              <Input label="WhatsApp Number (+91)" value={form.whatsapp_number}
                onChange={set('whatsapp_number')} placeholder="+919876543210" />
              <p className="text-zinc-500 font-semibold text-xs mt-2 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-brand" />
                All agentic reminders and responses will route exclusively to this number.
              </p>
            </div>
            <Select label="Preferred AI Intelligence Language" value={form.language_pref} onChange={set('language_pref')}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'Hindi / Hinglish' },
                { value: 'mr', label: 'Marathi' },
                { value: 'gu', label: 'Gujarati' },
                { value: 'ta', label: 'Tamil' },
                { value: 'te', label: 'Telugu' },
              ]} />
          </div>
        </Card>

        <Card className="bg-zinc-50 border-zinc-200 p-8 rounded-[2rem]">
          <h3 className="font-display font-800 text-xl text-zinc-900 mb-4 tracking-tight">WhatsApp Initialization Guide</h3>
          <ol className="space-y-4 text-sm text-zinc-600 font-medium">
            {[
              'Save +91-XXXXX-XXXXX as "Vaani Executive Assistant" in your device contacts.',
              'Send "Hello Vaani" over WhatsApp to securely authenticate your device.',
              'Deploy your first voice-note operation instantly.',
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-center">
                <span className="w-7 h-7 rounded-xl bg-zinc-900 text-white text-xs font-display font-800 flex items-center justify-center flex-shrink-0 shadow-sm">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex items-center gap-4 pt-2">
          <Button onClick={save} loading={saving} size="lg" className="px-8 font-bold">
            <Save className="w-4 h-4 mr-2" />
            {saved ? 'Settings Enforced ✓' : 'Enforce Changes'}
          </Button>
          {saved && <span className="text-brand font-bold text-sm bg-brand/10 px-4 py-2 rounded-lg">Changes securely persisted to database.</span>}
        </div>
      </div>
    </DashboardShell>
  )
}
