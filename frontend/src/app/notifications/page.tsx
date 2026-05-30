"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Bell, CheckCheck, ExternalLink, AlertTriangle, Info, CheckCircle2, Package, Settings, ArrowLeft } from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const markAllRead = async () => {
    await api.post('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('Inbox zero 📭')
  }

  const typeIcon = (type: string) => {
    const cn = 'h-5 w-5'
    switch (type) {
      case 'success': return <CheckCircle2 className={`${cn} text-green-500`} />
      case 'warning': return <AlertTriangle className={`${cn} text-amber-500`} />
      case 'error': return <XIcon className={`${cn} text-red-500`} />
      case 'payment': return <Package className={`${cn} text-blue-500`} />
      default: return <Info className={`${cn} text-primary-500`} />
    }
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
            <Bell className="h-7 w-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-gray-500">Stay updated on your rentals and activity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" />Mark All Read
          </Button>
          <Link href="/notifications/preferences">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">You'll see updates about your rentals, KYC, and disputes here</p>
            </CardContent>
          </Card>
        ) : notifications.map(n => (
          <Card key={n.id} className={`border-gray-100 dark:border-gray-800 ${!n.is_read ? 'ring-2 ring-primary-500/20 bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="mt-1">{typeIcon(n.type || 'info')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-sm ${!n.is_read ? 'font-black' : 'font-bold'} text-gray-900 dark:text-white`}>{n.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {n.action_url && (
                      <Link href={n.action_url} className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline">
                        View Details <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {!n.is_read && (
                      <button onClick={async () => {
                        await api.post(`/notifications/${n.id}/read`)
                        fetch()
                      }} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <CheckCheck className="h-3 w-3" />Mark read
                      </button>
                    )}
                    <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function XIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
