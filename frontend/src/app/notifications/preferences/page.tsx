"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Bell, ArrowLeft, Save, Mail, Smartphone, BellRing, Shield, Gift, Scale, Megaphone, Truck } from 'lucide-react'

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try {
      const res = await api.get('/notifications/prefs')
      setPrefs(res.data.prefs || {})
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const toggle = (key: string) => {
    setPrefs((prev: any) => ({ ...prev, [key]: !prev[key] }))
  }

  const save = async () => {
    try {
      const body: any = {}
      const fields = ['email_alerts', 'push_alerts', 'sms_alerts', 'notify_rental_updates', 'notify_kyc_updates', 'notify_dispute_updates', 'notify_promotions', 'notify_referral_rewards']
      for (const f of fields) {
        if (prefs[f] !== undefined) body[f] = prefs[f]
      }
      await api.patch('/notifications/prefs', body)
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  const channels = [
    { key: 'email_alerts', label: 'Email', icon: Mail, desc: 'Receive email notifications' },
    { key: 'push_alerts', label: 'Push', icon: BellRing, desc: 'In-app notifications' },
    { key: 'sms_alerts', label: 'SMS', icon: Smartphone, desc: 'Text message alerts' },
  ]

  const categories = [
    { key: 'notify_rental_updates', label: 'Rental Updates', icon: Truck, desc: 'Status changes on your rentals' },
    { key: 'notify_kyc_updates', label: 'KYC Updates', icon: Shield, desc: 'Verification status changes' },
    { key: 'notify_dispute_updates', label: 'Dispute Updates', icon: Scale, desc: 'Messages and status on disputes' },
    { key: 'notify_promotions', label: 'Promotions', icon: Megaphone, desc: 'Coupons, deals, and promotions' },
    { key: 'notify_referral_rewards', label: 'Referral Rewards', icon: Gift, desc: 'Claimable referral rewards' },
  ]

  return (
    <div className="container py-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
            <p className="text-gray-500">Control how and when you receive notifications</p>
          </div>
        </div>
        <Button onClick={save} className="rounded-xl"><Save className="h-4 w-4 mr-2" />Save</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Bell className="h-4 w-4" />Channels</CardTitle>
          <CardDescription className="text-xs">Which delivery methods to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channels.map(ch => (
            <div key={ch.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ch.icon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-bold">{ch.label}</p>
                  <p className="text-xs text-gray-400">{ch.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(ch.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${prefs[ch.key] ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[ch.key] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Notification Types</CardTitle>
          <CardDescription className="text-xs">Choose which types of notifications to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <cat.icon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-bold">{cat.label}</p>
                  <p className="text-xs text-gray-400">{cat.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(cat.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${prefs[cat.key] ? 'bg-primary-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[cat.key] ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
