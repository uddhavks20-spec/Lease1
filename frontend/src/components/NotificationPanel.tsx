"use client"
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, ExternalLink, X, AlertTriangle, Info, CheckCircle2, Shield, Gift, Package } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  action_url: string
  created_at: string
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetch = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
      setUnreadCount(Number(res.data.unreadCount || 0))
    } catch {}
  }

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const markRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const typeIcon = (type: string) => {
    const cn = 'h-4 w-4 flex-shrink-0'
    switch (type) {
      case 'success': return <CheckCircle2 className={`${cn} text-green-500`} />
      case 'warning': return <AlertTriangle className={`${cn} text-amber-500`} />
      case 'error': return <X className={`${cn} text-red-500`} />
      case 'payment': return <Package className={`${cn} text-blue-500`} />
      default: return <Info className={`${cn} text-primary-500`} />
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  }

  return (
    <div ref={panelRef} className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary-600 text-white text-[9px] px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline">
                <CheckCheck className="h-3 w-3" />Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                <div className="flex gap-3">
                  <div className="mt-0.5">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs ${!n.is_read ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>{n.title}</p>
                      <span className="text-[9px] text-gray-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    {n.action_url && (
                      <Link href={n.action_url} className="text-[10px] font-bold text-primary-600 flex items-center gap-1 mt-1 hover:underline" onClick={() => { markRead(n.id); setOpen(false) }}>
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-[9px] text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
                      <CheckCheck className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <Link href="/notifications" className="block p-3 text-center text-[10px] font-bold text-primary-600 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 uppercase tracking-wider" onClick={() => setOpen(false)}>
              View All
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
